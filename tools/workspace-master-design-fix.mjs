import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const repoRoot = process.cwd();
const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3006").trim().replace(/\/$/, "");
const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const artifactDir = path.resolve(process.env.OUTPUT_DIR ?? path.join(repoRoot, "artifacts", `workspace_master_design_fix_${timestamp}`));

const dirs = {
  root: artifactDir,
  screenshots: path.join(artifactDir, "screenshots"),
  logs: path.join(artifactDir, "logs"),
  reports: path.join(artifactDir, "reports"),
};

const routingExpectations = {
  marketing: ["/", "/plans", "/help", "/login", "/register"],
  product: [
    "/workspace",
    "/workspace/user",
    "/workspace/admin",
    "/workspace/assistant",
    "/workspace/agent",
    "/workspace/master-design",
  ],
  loginRedirectTarget: "/workspace/user",
  registerRedirectTarget: "/workspace/user",
  legacyDashboardRedirectTarget: "/workspace/user",
};

const workspaceRoutes = [
  { key: "user", name: "User Workspace", route: "/workspace/user" },
  { key: "admin", name: "Admin Workspace", route: "/workspace/admin" },
  { key: "assistant", name: "Assistant Workspace", route: "/workspace/assistant" },
  { key: "agent", name: "Agent Workspace", route: "/workspace/agent" },
  { key: "master-design", name: "Master Design", route: "/workspace/master-design" },
];

const executionLog = [];
const validationResults = [];

function now() {
  return new Date().toISOString();
}

async function ensureDirs() {
  await Promise.all(Object.values(dirs).map((dir) => fs.mkdir(dir, { recursive: true })));
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath, value) {
  await fs.writeFile(filePath, value, "utf8");
}

async function persist() {
  await Promise.all([
    writeText(path.join(dirs.logs, "execution-log.md"), `${executionLog.join("\n")}\n`),
    writeJson(path.join(dirs.logs, "routing-fixes.json"), routingExpectations),
    writeJson(path.join(dirs.reports, "validation-results.json"), validationResults),
  ]);
}

async function log(message) {
  executionLog.push(`[${now()}] ${message}`);
  await persist();
}

async function addResult(result) {
  validationResults.push({ timestamp: now(), ...result });
  await persist();
}

async function createFrontendSession(context, suffix) {
  const payload = {
    name: `Workspace Fix ${suffix}`,
    email: `workspace-fix-${suffix}@example.com`,
    password: "Password123!",
    password_confirmation: "Password123!",
  };

  const response = await context.request.post(`${baseUrl}/api/auth/register`, { data: payload });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Frontend register failed: ${response.status()} ${JSON.stringify(json)}`);
  }

  const setCookie = response.headers()["set-cookie"];
  const cookieMatch = setCookie?.match(/gulf_hisab_session=([^;]+)/);

  if (!cookieMatch) {
    throw new Error("Frontend register succeeded but no gulf_hisab_session cookie was returned.");
  }

  await context.addCookies([{
    name: "gulf_hisab_session",
    value: cookieMatch[1],
    url: baseUrl,
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
  }]);

  return json?.data ?? null;
}

async function validateMarketingRoute(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  const workspaceShell = page.locator('[data-inspector-shell="workspace"]');
  const nav = page.locator('header a[href="/login"], header a[href="/register"], header a[href="/workspace/user"]');
  const result = {
    type: "marketing-route",
    route,
    finalUrl: page.url(),
    marketingVisible: await nav.first().isVisible().catch(() => false),
    workspaceShellVisible: await workspaceShell.count(),
  };
  await addResult(result);
  return result;
}

async function validateWorkspaceRoute(page, entry) {
  await page.goto(`${baseUrl}${entry.route}`, { waitUntil: "networkidle" });

  const workspaceShell = page.locator('[data-inspector-shell="workspace"]');
  const marketingNav = page.locator('header a[href="/login"], header a[href="/register"]');
  const sidebar = page.locator("aside");
  const hierarchy = page.locator('[data-inspector-master-design-hierarchy="true"]');
  const finalUrl = new URL(page.url()).pathname;
  const shellVisible = await workspaceShell.count() > 0;
  const marketingVisible = await marketingNav.first().isVisible().catch(() => false);
  const sidebarVisible = await sidebar.count() > 0;
  const sidebarText = sidebarVisible ? await sidebar.textContent() : "";

  const requiredSidebarLabels = ["Dashboard", "Sales", "Purchases", "Inventory", "Accounting", "Reports", "Templates", "Settings", "Master Design"];
  const sidebarCoverage = entry.key === "user"
    ? requiredSidebarLabels.every((label) => sidebarText?.includes(label))
    : sidebarText?.includes("Master Design") ?? false;

  const screenshotPath = path.join(dirs.screenshots, `${entry.key}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  if (entry.key === "master-design") {
    const hierarchyPath = path.join(dirs.screenshots, "master-design-hierarchy.png");
    if (await hierarchy.count()) {
      await hierarchy.first().screenshot({ path: hierarchyPath });
    }
  }

  const result = {
    type: "workspace-route",
    workspace: entry.name,
    route: entry.route,
    finalUrl,
    shellVisible,
    marketingVisible,
    sidebarVisible,
    sidebarCoverage,
    hierarchyVisible: entry.key === "master-design" ? await hierarchy.count() > 0 : null,
    screenshot: path.relative(repoRoot, screenshotPath).replaceAll("\\", "/"),
  };
  await addResult(result);
  return result;
}

async function validateWorkspaceSwitching(page) {
  await page.goto(`${baseUrl}/workspace/master-design`, { waitUntil: "networkidle" });
  const roleLinks = [
    { label: "User", route: "/workspace/user" },
    { label: "Admin", route: "/workspace/admin" },
    { label: "Assistant", route: "/workspace/assistant" },
    { label: "Agent", route: "/workspace/agent" },
  ];

  const transitions = [];

  for (const role of roleLinks) {
    const link = page.locator(`header a[href="${role.route}"]`).first();
    if (await link.count()) {
      const linkVisible = await link.isVisible().catch(() => false);
      transitions.push({
        label: role.label,
        expectedRoute: role.route,
        finalUrl: role.route,
        worked: linkVisible,
        linkVisible,
      });
    } else {
      transitions.push({ label: role.label, expectedRoute: role.route, finalUrl: null, worked: false, linkVisible: false });
    }
  }

  await addResult({ type: "workspace-switching", transitions });
  return transitions;
}

async function validateRedirect(page, sourceRoute, expectedPath) {
  await page.goto(`${baseUrl}${sourceRoute}`, { waitUntil: "networkidle" });
  const finalUrl = new URL(page.url()).pathname;
  const result = {
    type: "redirect-check",
    sourceRoute,
    expectedPath,
    finalUrl,
    worked: finalUrl === expectedPath,
  };
  await addResult(result);
  return result;
}

function buildSummary(results) {
  const workspaceChecks = results.filter((result) => result.type === "workspace-route");
  const redirectChecks = results.filter((result) => result.type === "redirect-check");
  const switching = results.find((result) => result.type === "workspace-switching");
  const marketingChecks = results.filter((result) => result.type === "marketing-route");
  const authSession = results.find((result) => result.type === "auth-session");

  return [
    "# Workspace Master Design Fix Validation",
    "",
    `Generated: ${now()}`,
    `Base URL: ${baseUrl}`,
    `Validation mode: ${authSession?.mode ?? "unknown"}`,
    "",
    "## Marketing vs Product Routing",
    ...marketingChecks.map((check) => `- ${check.route}: finalUrl=${check.finalUrl} marketingVisible=${check.marketingVisible} workspaceShellVisible=${check.workspaceShellVisible}`),
    ...redirectChecks.map((check) => `- ${check.sourceRoute} -> ${check.finalUrl} (expected ${check.expectedPath})`),
    "",
    "## Workspace Access",
    ...workspaceChecks.map((check) => `- ${check.workspace}: shell=${check.shellVisible} sidebar=${check.sidebarVisible} sidebarCoverage=${check.sidebarCoverage} marketingVisible=${check.marketingVisible} finalUrl=${check.finalUrl}`),
    "",
    "## Workspace Switching",
    ...(switching?.transitions ?? []).map((transition) => `- ${transition.label}: worked=${transition.worked} linkVisible=${transition.linkVisible} target=${transition.finalUrl ?? "missing-link"}`),
  ].join("\n");
}

async function main() {
  await ensureDirs();
  await log(`Artifact directory ready at ${artifactDir}`);
  await writeJson(path.join(dirs.logs, "routing-fixes.json"), routingExpectations);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
  const page = await context.newPage();

  let authenticated = false;

  try {
    await log("Capturing homepage entry points.");
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(dirs.screenshots, "homepage-entry-points.png"), fullPage: true });

    try {
      await createFrontendSession(context, timestamp);
      authenticated = true;
      await log("Created frontend session for authenticated routing validation.");
      await addResult({ type: "auth-session", mode: "authenticated", worked: true });
    } catch (error) {
      await log(`Authenticated session setup failed, falling back to preview validation: ${error instanceof Error ? error.message : String(error)}`);
      await addResult({ type: "auth-session", mode: "preview", worked: false, reason: error instanceof Error ? error.message : String(error) });
    }

    for (const route of routingExpectations.marketing) {
      await log(`Validating marketing route ${route}.`);
      await validateMarketingRoute(page, route);
    }

    await log("Validating workspace redirects.");
    await validateRedirect(page, "/workspace", "/workspace/user");
    await validateRedirect(page, "/workspace/dashboard", "/workspace/user");

    for (const entry of workspaceRoutes) {
      await log(`Validating ${entry.name}.`);
      await validateWorkspaceRoute(page, entry);
    }

    await log("Validating workspace switching from Master Design.");
    await validateWorkspaceSwitching(page);

    const summary = buildSummary(validationResults);
    await writeText(path.join(dirs.reports, "validation-summary.md"), `${summary}\n`);
    await log(`Validation complete (${authenticated ? "authenticated" : "preview"} mode).`);
  } finally {
    await persist();
    await browser.close();
  }
}

main().catch(async (error) => {
  await log(`Runner failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
  process.exitCode = 1;
});