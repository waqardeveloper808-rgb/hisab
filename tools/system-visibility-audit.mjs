import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const repoRoot = process.cwd();
const frontendBaseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3006").trim().replace(/\/$/, "");
const backendBaseUrl = (process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8000").trim().replace(/\/$/, "");
const artifactDir = path.resolve(process.env.OUTPUT_DIR ?? path.join(repoRoot, "artifacts", `system_visibility_audit_${Date.now()}`));
const backendEnvPath = path.join(repoRoot, "backend", ".env");

const dirs = {
  root: artifactDir,
  mhtml: path.join(artifactDir, "mhtml"),
  screenshots: path.join(artifactDir, "screenshots"),
  pdf: path.join(artifactDir, "pdf"),
  logs: path.join(artifactDir, "logs"),
  reports: path.join(artifactDir, "reports"),
  workflows: path.join(artifactDir, "workflows"),
};

const workspacePages = [
  { workspace: "User Workspace", page: "Overview", route: "/workspace/user", reachedBy: "Sidebar > Dashboard > Overview" },
  { workspace: "User Workspace", page: "Invoices", route: "/workspace/user/invoices", reachedBy: "Sidebar > Sales > Invoices" },
  { workspace: "User Workspace", page: "Invoice Create", route: "/workspace/invoices/new", reachedBy: "Quick action > Create Invoice" },
  { workspace: "User Workspace", page: "Bills", route: "/workspace/user/bills", reachedBy: "Sidebar > Purchases > Bills" },
  { workspace: "User Workspace", page: "Bill Create", route: "/workspace/bills/new", reachedBy: "Quick action > Add Bill" },
  { workspace: "User Workspace", page: "Products & Services", route: "/workspace/user/products", reachedBy: "Sidebar > Inventory > Products & Services" },
  { workspace: "User Workspace", page: "Stock Register", route: "/workspace/user/stock", reachedBy: "Sidebar > Inventory > Stock Register" },
  { workspace: "User Workspace", page: "Journal Entries", route: "/workspace/user/journal-entries", reachedBy: "Sidebar > Accounting > Journal Entries" },
  { workspace: "User Workspace", page: "Ledger", route: "/workspace/user/ledger", reachedBy: "Sidebar > Accounting > Ledger" },
  { workspace: "User Workspace", page: "Bank Accounts", route: "/workspace/user/banking", reachedBy: "Sidebar > Banking > Bank Accounts" },
  { workspace: "User Workspace", page: "Reconciliation", route: "/workspace/user/reconciliation", reachedBy: "Sidebar > Banking > Reconciliation" },
  { workspace: "User Workspace", page: "VAT Dashboard", route: "/workspace/user/vat", reachedBy: "Sidebar > VAT / Compliance > VAT Dashboard" },
  { workspace: "User Workspace", page: "All Reports", route: "/workspace/user/reports", reachedBy: "Sidebar > Reports > All Reports" },
  { workspace: "User Workspace", page: "Trial Balance", route: "/workspace/user/reports/trial-balance", reachedBy: "Sidebar > Reports > Trial Balance" },
  { workspace: "User Workspace", page: "Profit & Loss", route: "/workspace/user/reports/profit-loss", reachedBy: "Sidebar > Reports > Profit & Loss" },
  { workspace: "User Workspace", page: "Balance Sheet", route: "/workspace/user/reports/balance-sheet", reachedBy: "Sidebar > Reports > Balance Sheet" },
  { workspace: "User Workspace", page: "Invoice Templates", route: "/workspace/user/invoice-templates", reachedBy: "Sidebar > Templates > Invoice Templates" },
  { workspace: "User Workspace", page: "Document Templates", route: "/workspace/user/document-templates", reachedBy: "Templates register match prefix" },
  { workspace: "User Workspace", page: "Company Settings", route: "/workspace/settings/company", reachedBy: "Sidebar > Settings > Company Profile" },
  { workspace: "User Workspace", page: "Users Settings", route: "/workspace/settings/users", reachedBy: "Sidebar > Settings > Users" },
  { workspace: "User Workspace", page: "Accounting Settings", route: "/workspace/settings/accounting", reachedBy: "Sidebar > Settings > Accounting Settings" },

  { workspace: "Admin Workspace", page: "Overview", route: "/workspace/admin", reachedBy: "Workspace home" },
  { workspace: "Admin Workspace", page: "Customers", route: "/workspace/admin/customers", reachedBy: "Sidebar > Platform Control > Customers" },
  { workspace: "Admin Workspace", page: "Plans", route: "/workspace/admin/plans", reachedBy: "Sidebar > Platform Control > Plans" },
  { workspace: "Admin Workspace", page: "Support Accounts", route: "/workspace/admin/support-accounts", reachedBy: "Sidebar > Platform Control > Support Accounts" },
  { workspace: "Admin Workspace", page: "Audit", route: "/workspace/admin/audit", reachedBy: "Sidebar > Platform Control > Audit" },
  { workspace: "Admin Workspace", page: "System Health", route: "/workspace/admin/system-health", reachedBy: "Sidebar > Platform Control > System Health" },
  { workspace: "Admin Workspace", page: "Agents", route: "/workspace/admin/agents", reachedBy: "Sidebar > Commercial Operations > Agents" },
  { workspace: "Admin Workspace", page: "Integrations", route: "/workspace/admin/integrations", reachedBy: "Sidebar > Commercial Operations > Integrations" },
  { workspace: "Admin Workspace", page: "Document Templates", route: "/workspace/admin/document-templates", reachedBy: "Sidebar > Commercial Operations > Document Templates" },
  { workspace: "Admin Workspace", page: "Access Management", route: "/workspace/admin/access-management", reachedBy: "Sidebar > Access / Governance > Access Management" },
  { workspace: "Admin Workspace", page: "Company Reviews", route: "/workspace/admin/company-reviews", reachedBy: "Sidebar > Access / Governance > Company Reviews" },
  { workspace: "Admin Workspace", page: "Review Dashboard", route: "/workspace/admin/review", reachedBy: "Sidebar > AI Review > Review Dashboard" },
  { workspace: "Admin Workspace", page: "Review Findings", route: "/workspace/admin/review/findings", reachedBy: "Sidebar > AI Review > Findings" },
  { workspace: "Admin Workspace", page: "Review Modules", route: "/workspace/admin/review/modules", reachedBy: "Sidebar > AI Review > Module Health" },
  { workspace: "Admin Workspace", page: "Review Routes", route: "/workspace/admin/review/routes", reachedBy: "Sidebar > AI Review > Route Health" },
  { workspace: "Admin Workspace", page: "Review Prompts", route: "/workspace/admin/review/prompts", reachedBy: "Sidebar > AI Review > Prompt Generator" },
  { workspace: "Admin Workspace", page: "Review History", route: "/workspace/admin/review/history", reachedBy: "Sidebar > AI Review > Audit History" },

  { workspace: "Assistant Workspace", page: "Overview", route: "/workspace/assistant", reachedBy: "Workspace home" },
  { workspace: "Assistant Workspace", page: "Help Queue", route: "/workspace/assistant/help-queue", reachedBy: "Sidebar > Support Queue > Help Queue" },
  { workspace: "Assistant Workspace", page: "AI Help", route: "/workspace/assistant/ai-help", reachedBy: "Sidebar > Support Queue > AI Help" },
  { workspace: "Assistant Workspace", page: "Invoice Help", route: "/workspace/assistant/invoice-help", reachedBy: "Sidebar > Support Queue > Invoice Help" },
  { workspace: "Assistant Workspace", page: "Customer Follow-up", route: "/workspace/assistant/customer-follow-up", reachedBy: "Sidebar > Customer Success > Customer Follow-up" },
  { workspace: "Assistant Workspace", page: "Onboarding", route: "/workspace/assistant/onboarding", reachedBy: "Sidebar > Customer Success > Onboarding" },
  { workspace: "Assistant Workspace", page: "Pending Tasks", route: "/workspace/assistant/pending-tasks", reachedBy: "Sidebar > Customer Success > Pending Tasks" },
  { workspace: "Assistant Workspace", page: "Help Center", route: "/workspace/assistant/help-center", reachedBy: "Sidebar > Knowledge / Escalations > Help Center" },
  { workspace: "Assistant Workspace", page: "Customer Accounts", route: "/workspace/assistant/customer-accounts", reachedBy: "Sidebar > Knowledge / Escalations > Customer Accounts" },

  { workspace: "Agent Workspace", page: "Overview", route: "/workspace/agent", reachedBy: "Workspace home" },
  { workspace: "Agent Workspace", page: "Leads", route: "/workspace/agent/leads", reachedBy: "Sidebar > Pipeline > Leads" },
  { workspace: "Agent Workspace", page: "Referrals", route: "/workspace/agent/referrals", reachedBy: "Sidebar > Pipeline > Referrals" },
  { workspace: "Agent Workspace", page: "Assigned Accounts", route: "/workspace/agent/assigned-accounts", reachedBy: "Sidebar > Pipeline > Assigned Accounts" },
  { workspace: "Agent Workspace", page: "Pipeline", route: "/workspace/agent/pipeline", reachedBy: "Sidebar > Pipeline > Pipeline" },
  { workspace: "Agent Workspace", page: "Follow-ups", route: "/workspace/agent/follow-ups", reachedBy: "Sidebar > Outreach > Follow-ups" },
  { workspace: "Agent Workspace", page: "Pending Outreach", route: "/workspace/agent/pending-outreach", reachedBy: "Sidebar > Outreach > Pending Outreach" },
  { workspace: "Agent Workspace", page: "Activity Log", route: "/workspace/agent/activity", reachedBy: "Sidebar > Outreach > Activity Log" },

  { workspace: "Master Design", page: "Master Design", route: "/workspace/master-design", reachedBy: "Persistent shell link > Master Design" },
];

const pageIndex = [];
const buttonLog = [];
const workflowLog = [];
const usabilityReport = [];
const blockerLog = [];
const executionLines = [];

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

async function persistLogs() {
  await Promise.all([
    writeText(path.join(dirs.logs, "execution-log.md"), `${executionLines.join("\n")}\n`),
    writeJson(path.join(dirs.reports, "page-index.json"), pageIndex),
    writeJson(path.join(dirs.logs, "button-log.json"), buttonLog),
    writeJson(path.join(dirs.workflows, "workflow-log.json"), workflowLog),
    writeJson(path.join(dirs.reports, "usability-report.json"), usabilityReport),
    writeJson(path.join(dirs.logs, "blocker-log.json"), blockerLog),
  ]);
}

async function appendExecution(message) {
  executionLines.push(`[${now()}] ${message}`);
  await persistLogs();
}

async function addBlocker(entry) {
  blockerLog.push({ timestamp: now(), ...entry });
  await persistLogs();
}

async function readDotEnvValue(filePath, key) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
    return match ? match[1].trim().replace(/^"|"$/g, "") : null;
  } catch {
    return null;
  }
}

function workspaceHeaders(actorId, workspaceToken, extra = {}) {
  return {
    Accept: "application/json",
    "X-Gulf-Hisab-Workspace-Token": workspaceToken,
    "X-Gulf-Hisab-Actor-Id": String(actorId),
    ...extra,
  };
}

async function backendJson(url, { method = "GET", headers = {}, body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${method} ${url} failed: ${response.status} ${response.statusText} ${JSON.stringify(json)}`);
  }
  return json;
}

async function createFrontendSession(context, suffix) {
  const payload = {
    name: `Visibility Audit ${suffix}`,
    email: `visibility-audit-${suffix}@example.com`,
    password: "Password123!",
    password_confirmation: "Password123!",
  };

  const response = await context.request.post(`${frontendBaseUrl}/api/auth/register`, { data: payload });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Frontend register failed: ${response.status()} ${JSON.stringify(json)}`);
  }
  return json.data;
}

async function setupWorkspaceRoute(context, { companyId, actorId, workspaceToken }) {
  await context.route("**/api/workspace/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const slugPath = url.pathname.replace(/^\/api\/workspace\//, "");
    const targetUrl = `${backendBaseUrl}/api/companies/${companyId}/${slugPath}${url.search}`;
    const contentType = request.headers()["content-type"];
    const response = await fetch(targetUrl, {
      method: request.method(),
      headers: {
        Accept: request.headers()["accept"] ?? "application/json",
        ...(contentType ? { "Content-Type": contentType } : {}),
        "X-Gulf-Hisab-Workspace-Token": workspaceToken,
        "X-Gulf-Hisab-Actor-Id": String(actorId),
      },
      body: ["GET", "HEAD"].includes(request.method()) ? undefined : request.postDataBuffer(),
    });
    const body = [204, 304].includes(response.status) || request.method() === "HEAD"
      ? undefined
      : Buffer.from(await response.arrayBuffer());
    const headers = {};
    for (const key of ["content-type", "content-disposition", "cache-control"]) {
      const value = response.headers.get(key);
      if (value) {
        headers[key] = value;
      }
    }
    await route.fulfill({ status: response.status, headers, body });
  });
}

async function captureMhtml(page, filePath) {
  const session = await page.context().newCDPSession(page);
  const snapshot = await session.send("Page.captureSnapshot", { format: "mhtml" });
  await fs.writeFile(filePath, snapshot.data, "utf8");
  await session.detach();
}

async function capturePdf(page, filePath) {
  const pdf = await page.pdf({ path: filePath, printBackground: true, format: "A4", margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" } });
  return pdf;
}

async function safeGoto(page, url) {
  try {
    return await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  } catch (error) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    return null;
  }
}

async function visibleHeading(page) {
  const headings = ["h1", "[data-inspector-shell='workspace'] h2", "main h2", "main h3"];
  for (const selector of headings) {
    const text = await page.locator(selector).first().textContent().catch(() => null);
    if (text && text.trim()) {
      return text.trim();
    }
  }
  return "Untitled";
}

function classifyPage(info) {
  const text = info.text.toLowerCase();
  const actionCount = info.actionCount;
  if (info.unreachable) {
    return { classification: "BROKEN", reason: "Route was unreachable or returned an error surface." };
  }
  if (text.includes("not found") || text.includes("404")) {
    return { classification: "BROKEN", reason: "Page resolves to not-found content." };
  }
  if (text.includes("coming soon") || text.includes("placeholder") || text.includes("under construction")) {
    return { classification: "MISLEADING", reason: "Page is present but communicates placeholder state instead of usable workflow." };
  }
  if (actionCount === 0) {
    return { classification: "INTERNAL / NON-PRODUCT", reason: "Page exposes almost no visible actions and behaves like an internal shell." };
  }
  if (text.includes("no ") && text.includes("yet") && actionCount < 3) {
    return { classification: "BLOCKED BY MISSING DATA", reason: "Primary state is empty and offers limited path forward." };
  }
  if (text.length > 9000 && actionCount < 4) {
    return { classification: "BLOCKED BY BAD UX", reason: "High reading burden with too few obvious actions." };
  }
  if (actionCount < 2) {
    return { classification: "PARTIALLY USABLE", reason: "Page loads but exposes too few reliable interactions." };
  }
  return { classification: "USABLE", reason: "Page loads with visible actions and no immediate blocker detected during capture." };
}

async function collectActionCandidates(page) {
  return page.evaluate(() => {
    const selectors = ["button", "a[href]", "summary", "[role='button']"];
    const elements = Array.from(document.querySelectorAll(selectors.join(",")));
    return elements
      .map((element, index) => {
        const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const tag = element.tagName.toLowerCase();
        const href = tag === "a" ? element.getAttribute("href") : null;
        const disabled = element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true";
        const visible = rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
        return {
          index,
          tag,
          text,
          href,
          disabled,
          visible,
        };
      })
      .filter((item) => item.visible && item.text && item.text.length <= 80)
      .filter((item) => !/logout|close workspace navigation/i.test(item.text));
  });
}

async function testActionsForPage(page, pageDef, pageSlug) {
  const candidates = await collectActionCandidates(page);
  const tested = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const dedupeKey = `${candidate.tag}:${candidate.text}:${candidate.href ?? ""}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    tested.push(candidate);
    if (tested.length >= 12) {
      break;
    }
  }

  for (const candidate of tested) {
    const urlBefore = page.url();
    const locator = page.locator(candidate.tag === "a" && candidate.href ? `a[href="${candidate.href}"]` : candidate.tag).filter({ hasText: candidate.text }).first();
    let result = "no visible action";
    let reason = "No state change detected after click.";
    let urlAfter = urlBefore;
    let screenshotPath = null;
    try {
      if (candidate.disabled) {
        result = "blocked";
        reason = "Control is disabled before interaction.";
      } else if (candidate.href && candidate.href.startsWith("/")) {
        await locator.click({ timeout: 5000 });
        await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => null);
        urlAfter = page.url();
        if (urlAfter !== urlBefore) {
          result = "worked";
          reason = "Navigation occurred.";
        } else {
          await page.goto(`${frontendBaseUrl}${candidate.href}`, { waitUntil: "domcontentloaded", timeout: 15000 });
          await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => null);
          urlAfter = page.url();
          result = urlAfter !== urlBefore ? "worked" : "partial";
          reason = urlAfter !== urlBefore ? "Direct navigation fallback worked." : "Link click did not move to a new route.";
        }
        await safeGoto(page, `${frontendBaseUrl}${pageDef.route}`);
      } else {
        const before = await page.locator("body").innerText().catch(() => "");
        try {
          await locator.click({ timeout: 5000 });
        } catch {
          await locator.evaluate((node) => node.click());
        }
        await page.waitForTimeout(800);
        const after = await page.locator("body").innerText().catch(() => "");
        urlAfter = page.url();
        if (urlAfter !== urlBefore) {
          result = "worked";
          reason = "Button triggered navigation.";
          await safeGoto(page, `${frontendBaseUrl}${pageDef.route}`);
        } else if (after !== before) {
          result = "partial";
          reason = "Button changed the page state but did not complete a navigation.";
        } else {
          result = "no visible action";
          reason = "No navigation or visible content change detected.";
        }
      }
    } catch (error) {
      result = "failed";
      reason = error instanceof Error ? error.message : String(error);
      screenshotPath = path.join(dirs.screenshots, `${pageSlug}-${slug(candidate.text)}-failed.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => null);
    }

    buttonLog.push({
      workspace: pageDef.workspace,
      page: pageDef.page,
      button: candidate.text,
      selector: `${candidate.tag}${candidate.href ? `[href='${candidate.href}']` : ""}`,
      clickAttempted: true,
      result: result.toUpperCase(),
      navigationTarget: urlAfter !== urlBefore ? urlAfter : null,
      errorMessage: result === "failed" ? reason : null,
      emptyState: /empty|no .* yet/i.test(reason) ? reason : null,
      confusingBehavior: result === "no visible action" ? reason : null,
      urlBefore,
      urlAfter,
      screenshot: screenshotPath ? path.relative(artifactDir, screenshotPath).replaceAll("\\", "/") : null,
    });
  }

  await persistLogs();
  return tested.length;
}

async function auditPage(page, pageDef) {
  const routeUrl = `${frontendBaseUrl}${pageDef.route}`;
  const pageSlug = `${slug(pageDef.workspace.replace(/ workspace/i, ""))}-${slug(pageDef.page)}`;
  let unreachable = false;
  let finalUrl = routeUrl;
  let status = null;

  try {
    const response = await safeGoto(page, routeUrl);
    status = response?.status?.() ?? null;
    finalUrl = page.url();
  } catch (error) {
    unreachable = true;
    await addBlocker({ workspace: pageDef.workspace, page: pageDef.page, route: pageDef.route, blocker: error instanceof Error ? error.message : String(error) });
  }

  const heading = unreachable ? "Unreachable" : await visibleHeading(page);
  const bodyText = unreachable ? "" : await page.locator("body").innerText().catch(() => "");
  const screenshotPath = path.join(dirs.screenshots, `${pageSlug}.png`);
  const mhtmlPath = path.join(dirs.mhtml, `${pageSlug}.mhtml`);
  const pdfPath = path.join(dirs.pdf, `${pageSlug}.pdf`);

  if (!unreachable) {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await captureMhtml(page, mhtmlPath).catch(async (error) => {
      await addBlocker({ workspace: pageDef.workspace, page: pageDef.page, route: pageDef.route, blocker: `MHTML capture failed: ${error instanceof Error ? error.message : String(error)}` });
    });
    await capturePdf(page, pdfPath).catch(async (error) => {
      await addBlocker({ workspace: pageDef.workspace, page: pageDef.page, route: pageDef.route, blocker: `PDF capture failed: ${error instanceof Error ? error.message : String(error)}` });
    });
  }

  const actionCount = unreachable ? 0 : await testActionsForPage(page, pageDef, pageSlug);
  const classification = classifyPage({ text: bodyText, actionCount, unreachable });
  const dedicatedBadStateScreenshot = (classification.classification === "BROKEN" || classification.classification === "MISLEADING" || classification.classification === "BLOCKED BY BAD UX") && !unreachable
    ? path.join(dirs.screenshots, `${pageSlug}-${slug(classification.classification)}.png`)
    : null;

  if (dedicatedBadStateScreenshot) {
    await page.screenshot({ path: dedicatedBadStateScreenshot, fullPage: true }).catch(() => null);
  }

  pageIndex.push({
    workspace: pageDef.workspace,
    pageName: pageDef.page,
    route: pageDef.route,
    url: finalUrl,
    howReached: pageDef.reachedBy,
    reachable: !unreachable,
    status,
    title: await page.title().catch(() => ""),
    moduleName: heading,
    notes: classification.reason,
  });

  usabilityReport.push({
    workspace: pageDef.workspace,
    page: pageDef.page,
    route: pageDef.route,
    url: finalUrl,
    classification: classification.classification,
    reason: classification.reason,
    signals: {
      actionCount,
      textLength: bodyText.length,
      largeEmptySpaceLikely: bodyText.length < 300,
      tooManyInstructionsBeforeAction: bodyText.length > 8000,
      brokenNavigationLikely: finalUrl.includes("not-found") || bodyText.toLowerCase().includes("not found"),
    },
    screenshot: unreachable ? null : path.relative(artifactDir, screenshotPath).replaceAll("\\", "/"),
    dedicatedScreenshot: dedicatedBadStateScreenshot ? path.relative(artifactDir, dedicatedBadStateScreenshot).replaceAll("\\", "/") : null,
  });

  await appendExecution(`Captured ${pageDef.workspace} :: ${pageDef.page} at ${finalUrl} with classification ${classification.classification}.`);
}

async function runWorkflowA(page) {
  const record = {
    flow: "FLOW A",
    name: "Customer selection to invoice draft",
    start: "/workspace/invoices/new",
    status: "BLOCKED",
    blocker: null,
    notes: [],
    screenshot: null,
  };
  try {
    await safeGoto(page, `${frontendBaseUrl}/workspace/invoices/new`);
    const customerField = page.getByText(/customer|contact/i).first();
    if (await customerField.isVisible().catch(() => false)) {
      record.notes.push("Invoice create surface loaded and contact control is visible.");
    } else {
      record.notes.push("Invoice create page loaded but contact starting point is not obvious.");
    }
    const saveButton = page.getByRole("button", { name: /^Save$/i }).first();
    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click().catch(() => null);
      await page.waitForTimeout(1000);
      record.status = "PARTIAL";
      record.notes.push("Save action is visible, but the workflow needs prefilled invoice state before a meaningful draft can be created.");
    } else {
      record.blocker = "Save button not visible on the invoice create page.";
    }
  } catch (error) {
    record.blocker = error instanceof Error ? error.message : String(error);
  }
  if (record.blocker) {
    record.screenshot = path.relative(artifactDir, path.join(dirs.screenshots, "flow-a-blocked.png")).replaceAll("\\", "/");
    await page.screenshot({ path: path.join(dirs.screenshots, "flow-a-blocked.png"), fullPage: true }).catch(() => null);
  }
  workflowLog.push(record);
  if (record.blocker) {
    await addBlocker({ workspace: "User Workspace", page: "Invoice Create", route: "/workspace/invoices/new", blocker: record.blocker });
  }
}

async function runWorkflowB(page) {
  const record = {
    flow: "FLOW B",
    name: "Product create to inventory to invoice line",
    start: "/workspace/user/products",
    status: "BLOCKED",
    blocker: null,
    notes: [],
    screenshot: null,
  };
  try {
    await safeGoto(page, `${frontendBaseUrl}/workspace/user/products`);
    const addProductButton = page.getByRole("button", { name: /Add Product/i }).first();
    if (await addProductButton.isVisible().catch(() => false)) {
      await addProductButton.click().catch(() => null);
      record.notes.push("Product register exposes an Add Product action.");
    } else {
      record.blocker = "Product create action is not visible.";
    }
    if (!record.blocker) {
      await safeGoto(page, `${frontendBaseUrl}/workspace/user/stock`);
      record.notes.push("Stock register is reachable after products.");
      await safeGoto(page, `${frontendBaseUrl}/workspace/invoices/new`);
      record.status = "PARTIAL";
      record.notes.push("Flow can navigate across the three pages, but this audit did not find a clean inline path from stock to a prefilled invoice line item." );
    }
  } catch (error) {
    record.blocker = error instanceof Error ? error.message : String(error);
  }
  if (record.blocker) {
    record.screenshot = path.relative(artifactDir, path.join(dirs.screenshots, "flow-b-blocked.png")).replaceAll("\\", "/");
    await page.screenshot({ path: path.join(dirs.screenshots, "flow-b-blocked.png"), fullPage: true }).catch(() => null);
  }
  workflowLog.push(record);
}

async function runWorkflowC(page) {
  const record = {
    flow: "FLOW C",
    name: "Import data to mapping to reuse",
    start: "/workspace/user/products",
    status: "BLOCKED",
    blocker: null,
    notes: [],
    screenshot: null,
  };
  try {
    await safeGoto(page, `${frontendBaseUrl}/workspace/user/products`);
    const panel = page.locator('[data-inspector-import-panel="item"]').first();
    const openImportButton = panel.getByRole("button", { name: /Open Import/i }).first();
    await openImportButton.click({ timeout: 5000 }).catch(() => null);
    if (await panel.isVisible().catch(() => false)) {
      await panel.locator("textarea").fill("product name,stock keeping unit,item type,sales price,purchase price,tax code,product group\nAudit Import One,AUD-001,product,100,70,Standard VAT 15%,Audit");
      const autoMap = panel.getByRole("button", { name: /Auto-map/i }).first();
      if (await autoMap.isVisible().catch(() => false)) {
        await autoMap.click().catch(() => null);
      }
      await panel.getByRole("button", { name: /Preview Import/i }).click().catch(() => null);
      record.notes.push("Import panel loads and preview can be attempted from the product register.");
      record.status = "PARTIAL";
      record.notes.push("Reuse of imported records inside the invoice workflow is not obvious from the import surface alone.");
    } else {
      record.blocker = "Import panel did not open from the product register.";
    }
  } catch (error) {
    record.blocker = error instanceof Error ? error.message : String(error);
  }
  if (record.blocker) {
    record.screenshot = path.relative(artifactDir, path.join(dirs.screenshots, "flow-c-blocked.png")).replaceAll("\\", "/");
    await page.screenshot({ path: path.join(dirs.screenshots, "flow-c-blocked.png"), fullPage: true }).catch(() => null);
  }
  workflowLog.push(record);
}

async function runWorkflowD(page) {
  const record = {
    flow: "FLOW D",
    name: "Template edit to preview changes",
    start: "/workspace/user/document-templates",
    status: "BLOCKED",
    blocker: null,
    notes: [],
    screenshot: null,
  };
  try {
    await safeGoto(page, `${frontendBaseUrl}/workspace/user/document-templates`);
    const fullscreenButton = page.getByRole("button", { name: /Full Screen Editor/i }).first();
    if (await fullscreenButton.isVisible().catch(() => false)) {
      await fullscreenButton.click().catch(() => null);
      record.notes.push("Fullscreen editor is reachable from the template page.");
    }
    const previewText = await page.locator('[data-inspector-split-view="true"]').first().textContent().catch(() => "");
    if (previewText) {
      record.status = "WORKED";
      record.notes.push("Template editor and live preview load on the same screen.");
    } else {
      record.blocker = "Template canvas did not render visible content.";
    }
  } catch (error) {
    record.blocker = error instanceof Error ? error.message : String(error);
  }
  if (record.blocker) {
    record.screenshot = path.relative(artifactDir, path.join(dirs.screenshots, "flow-d-blocked.png")).replaceAll("\\", "/");
    await page.screenshot({ path: path.join(dirs.screenshots, "flow-d-blocked.png"), fullPage: true }).catch(() => null);
  }
  workflowLog.push(record);
}

async function runWorkflowE(page) {
  const record = {
    flow: "FLOW E",
    name: "Cross-workspace navigation",
    start: "/workspace/user",
    status: "WORKED",
    blocker: null,
    notes: [],
    screenshot: null,
  };
  try {
    for (const route of ["/workspace/user", "/workspace/admin", "/workspace/assistant", "/workspace/agent", "/workspace/master-design"]) {
      await safeGoto(page, `${frontendBaseUrl}${route}`);
      record.notes.push(`Reached ${route} -> ${page.url()}`);
    }
  } catch (error) {
    record.status = "BLOCKED";
    record.blocker = error instanceof Error ? error.message : String(error);
  }
  if (record.blocker) {
    record.screenshot = path.relative(artifactDir, path.join(dirs.screenshots, "flow-e-blocked.png")).replaceAll("\\", "/");
    await page.screenshot({ path: path.join(dirs.screenshots, "flow-e-blocked.png"), fullPage: true }).catch(() => null);
  }
  workflowLog.push(record);
}

async function writeUsabilitySummary() {
  const grouped = new Map();
  for (const entry of usabilityReport) {
    const group = grouped.get(entry.workspace) ?? [];
    group.push(entry);
    grouped.set(entry.workspace, group);
  }
  const lines = ["# Usability Summary", ""]; 
  for (const [workspace, entries] of grouped.entries()) {
    const counts = entries.reduce((acc, entry) => {
      acc[entry.classification] = (acc[entry.classification] ?? 0) + 1;
      return acc;
    }, {});
    lines.push(`## ${workspace}`);
    lines.push(`- Usable: ${counts.USABLE ?? 0}`);
    lines.push(`- Partially usable: ${counts["PARTIALLY USABLE"] ?? 0}`);
    lines.push(`- Broken: ${counts.BROKEN ?? 0}`);
    lines.push(`- Misleading: ${counts.MISLEADING ?? 0}`);
    lines.push(`- Internal / Non-product: ${counts["INTERNAL / NON-PRODUCT"] ?? 0}`);
    lines.push(`- Blocked by missing data: ${counts["BLOCKED BY MISSING DATA"] ?? 0}`);
    lines.push(`- Blocked by bad UX: ${counts["BLOCKED BY BAD UX"] ?? 0}`);
    lines.push("");
  }
  await writeText(path.join(dirs.reports, "usability-summary.md"), `${lines.join("\n")}\n`);
}

async function seedExecutionLog() {
  executionLines.push("# System Visibility Audit");
  executionLines.push("");
  executionLines.push(`Start Time: ${now()}`);
  executionLines.push(`Artifact Folder: ${artifactDir}`);
  executionLines.push("");
  executionLines.push("Scope:");
  executionLines.push("- Full page inventory across User, Admin, Assistant, Agent, and Master Design workspaces");
  executionLines.push("- Full-page capture to PNG, MHTML, and PDF where stable");
  executionLines.push("- Button and action testing with result logging");
  executionLines.push("- Workflow testing for invoice, inventory, import, templates, and cross-workspace navigation");
  executionLines.push("- Usability classification and blocker extraction");
  executionLines.push("");
  await persistLogs();
}

async function main() {
  await ensureDirs();
  await seedExecutionLog();
  const workspaceToken = (process.env.WORKSPACE_API_TOKEN ?? await readDotEnvValue(backendEnvPath, "WORKSPACE_API_TOKEN") ?? "").trim();
  if (!workspaceToken) {
    throw new Error("WORKSPACE_API_TOKEN is required via env or backend/.env.");
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1400 }, acceptDownloads: true });
  const page = await context.newPage();

  try {
    const suffix = `${Date.now()}`;
    const actor = await createFrontendSession(context, suffix);
    await appendExecution(`Created frontend session for ${actor.email} (#${actor.id}).`);
    const companyResponse = await backendJson(`${backendBaseUrl}/api/companies`, {
      method: "POST",
      headers: workspaceHeaders(actor.id, workspaceToken),
      body: { legal_name: `System Visibility Audit ${suffix}` },
    });
    await appendExecution(`Created audit company ${companyResponse.data.id}.`);
    await setupWorkspaceRoute(context, { companyId: companyResponse.data.id, actorId: actor.id, workspaceToken });

    for (const pageDef of workspacePages) {
      await auditPage(page, pageDef);
    }

    await runWorkflowA(page);
    await runWorkflowB(page);
    await runWorkflowC(page);
    await runWorkflowD(page);
    await runWorkflowE(page);
    await writeUsabilitySummary();
    await persistLogs();
    await appendExecution("System visibility audit completed successfully.");
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify({ artifactDir, pagesDiscovered: pageIndex.length, buttonsTested: buttonLog.length, blockedWorkflows: workflowLog.filter((entry) => entry.status === "BLOCKED").length }, null, 2));
}

main().catch(async (error) => {
  blockerLog.push({ timestamp: now(), workspace: "Audit Runner", page: "Audit Runner", route: null, blocker: error instanceof Error ? error.stack ?? error.message : String(error) });
  await persistLogs().catch(() => null);
  console.error(error);
  process.exitCode = 1;
});