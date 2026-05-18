#!/usr/bin/env node
/**
 * Final Recovery UI Phase 1: Playwright workspace smoke + sidebar + invoice preview +
 * preview-mode API sanity (read-only endpoints must not return 403).
 */

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE = (
  process.env.FINAL_RECOVERY_BASE ||
  process.env.BASE_URL ||
  "http://127.0.0.1:3000"
).replace(/\/$/, "");

const OUT = process.env.FINAL_RECOVERY_OUT;
if (!OUT || !fs.existsSync(OUT)) {
  console.error(
    "FINAL_RECOVERY_OUT must point to an existing artifact root directory.",
  );
  process.exit(2);
}

const SHOTS = path.join(OUT, "screenshots");
const REPORT_JSON = path.join(OUT, "reports", "ui-browser-validation.json");
const PLACEHOLDER = /^\s*(coming\s+soon|under construction)\s*$/im;

/** One representative child link id per sidebar group */
const SIDEBAR_GROUPS = [
  { groupId: "purchases", linkTestId: "workspace-nav-link-vendors" },
  { groupId: "inventory", linkTestId: "workspace-nav-link-products" },
  { groupId: "accounting", linkTestId: "workspace-nav-link-acct-hub" },
  { groupId: "banking", linkTestId: "workspace-nav-link-bank-accounts" },
  { groupId: "vat", linkTestId: "workspace-nav-link-vat-dashboard" },
  { groupId: "reports", linkTestId: "workspace-nav-link-reports-hub" },
  { groupId: "import", linkTestId: "workspace-nav-link-import-hub" },
  { groupId: "templates", linkTestId: "workspace-nav-link-templates-list" },
  { groupId: "settings", linkTestId: "workspace-nav-link-settings-profile" },
  { groupId: "help", linkTestId: "workspace-nav-link-help-center" },
];

function ensureDirs() {
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });
}

async function main() {
  ensureDirs();
  const failures = [];
  const consoleErrors = [];
  const networkProblems = [];
  const previewProbeResults = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await context.addInitScript(() => {
    try {
      window.localStorage?.removeItem?.("hisabix.wsv2.sidebar.collapsed");
      window.localStorage?.removeItem?.("hisabix.wsv2.sidebar.openGroups");
    } catch {
      /* ignore */
    }
  });
  const page = await context.newPage();

  page.on("console", (msg) => {
    const t = String(msg.text());
    if (msg.type() === "error") consoleErrors.push(t);
    if (/hydration failed|missing _next\/static|fetch failed/i.test(t)) {
      failures.push(`console_critical: ${t}`);
    }
  });

  page.on("response", async (res) => {
    const u = res.url();
    try {
      const st = res.status();
      if (st >= 400 && u.includes("/_next/static")) {
        networkProblems.push({ url: u, status: st });
      }
      if ([403, 404, 500].includes(st) && u.includes("/api/workspace/")) {
        networkProblems.push({ url: u, status: st });
      }
    } catch {
      /* ignore */
    }
  });

  const invoicesUrl = `${BASE}/workspace/user/invoices`;

  try {
    const navInv = await page.goto(invoicesUrl, {
      waitUntil: "domcontentloaded",
      timeout: 180_000,
    });
    const invStatus = navInv?.status() ?? 0;
    if (invStatus >= 400) failures.push(`invoices_nav_status:${invStatus}`);
    await page.waitForSelector('[data-testid="workspace-nav-group-sales"]', { timeout: 60_000 });
    await page.waitForTimeout(1500);

    const collapsedShell = await page.locator('.wsv2-shell[data-collapsed="true"]').count();
    if (collapsedShell > 0) {
      const expand = page.locator('aside.wsv2-sidebar button[aria-label="Expand sidebar"]');
      await expand.click({ timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(600);
    }

    if ((await page.locator('[aria-label="Open WhatsApp support"]').count()) > 0) {
      failures.push("floating_whatsapp_visible");
    }
    const aiBtns = await page.locator('button[aria-label="Chat"]').count();
    if (aiBtns > 0) failures.push("floating_ai_visible");

    await page.screenshot({
      path: path.join(SHOTS, "invoices-register-before-preview.png"),
      fullPage: true,
    }).catch(() =>
      failures.push("screenshot_missing:invoices-register-before-preview"),
    );

    for (const { groupId } of SIDEBAR_GROUPS) {
      await page.goto(invoicesUrl, { waitUntil: "domcontentloaded", timeout: 180_000 }).catch(() => {});
      await page.waitForTimeout(900);
      const collapsed = await page.locator('.wsv2-shell[data-collapsed="true"]').count();
      if (collapsed > 0) {
        await page
          .locator('aside.wsv2-sidebar button[aria-label="Expand sidebar"]')
          .click({ timeout: 15_000 })
          .catch(() => {});
        await page.waitForTimeout(500);
      }
      const btn = page.locator(`[data-testid="workspace-nav-group-${groupId}"]`);
      await btn.click({ timeout: 20_000 });
      await page.waitForTimeout(700);
      const section = btn.locator("xpath=parent::div");
      const visibleInSection = await section.locator(".wsv2-nav-children a.wsv2-nav-link").count();
      if (visibleInSection < 1) {
        failures.push(`sidebar_group_no_children:${groupId}`);
      }
      await page
        .screenshot({
          path: path.join(SHOTS, `sidebar-group-${groupId}-open.png`),
          fullPage: true,
        })
        .catch(() =>
          failures.push(`screenshot_missing:sidebar-group-${groupId}-open`),
        );
    }

    const aggCandidates = SIDEBAR_GROUPS.map((g) =>
      path.join(SHOTS, `sidebar-group-${g.groupId}-open.png`),
    ).filter((p) => fs.existsSync(p));
    const aggPath = path.join(SHOTS, "sidebar-each-group-open.png");
    if (aggCandidates.length) fs.copyFileSync(aggCandidates[aggCandidates.length - 1], aggPath);
    else failures.push("screenshot_missing:sidebar-each-group-open");

    for (const { groupId, linkTestId } of SIDEBAR_GROUPS) {
      await page.goto(invoicesUrl, { waitUntil: "domcontentloaded", timeout: 180_000 });
      await page.waitForTimeout(900);
      if ((await page.locator('.wsv2-shell[data-collapsed="true"]').count()) > 0) {
        await page
          .locator('aside.wsv2-sidebar button[aria-label="Expand sidebar"]')
          .click({ timeout: 15_000 })
          .catch(() => {});
        await page.waitForTimeout(500);
      }
      await page.locator(`[data-testid="workspace-nav-group-${groupId}"]`).click({ timeout: 20_000 });
      const dest = page.locator(`[data-testid="${linkTestId}"]`).first();
      await dest.waitFor({ state: "visible", timeout: 20_000 });
      await dest.click({ timeout: 20_000 });
      await page.waitForTimeout(1500);
      const bodySmall = await page.locator("body").innerText().catch(() => "");
      if (PLACEHOLDER.test(bodySmall.slice(0, 800))) failures.push(`placeholder_page:${groupId}`);
    }

    await page.goto(invoicesUrl, { waitUntil: "domcontentloaded", timeout: 180_000 });
    await page.waitForTimeout(900);
    if ((await page.locator('.wsv2-shell[data-collapsed="true"]').count()) > 0) {
      await page
        .locator('aside.wsv2-sidebar button[aria-label="Expand sidebar"]')
        .click({ timeout: 15_000 })
        .catch(() => {});
      await page.waitForTimeout(500);
    }

    const firstRow = page.locator('tr[data-testid^="invoice-row-"]').first();
    if ((await firstRow.count()) > 0) {
      await firstRow.click({ timeout: 15_000 });
      await page.waitForTimeout(1200);
      const paneVisible = await page.locator('[data-testid="invoice-preview-pane"]').isVisible();
      if (!paneVisible) failures.push("invoice_row_preview_pane_missing");

      const prevBtn = page.locator('[data-testid^="invoice-preview-action-"]').first();
      if ((await prevBtn.count()) > 0) {
        await prevBtn.click({ timeout: 10_000 });
        await page.waitForTimeout(1000);
      }
      const paneStill = await page.locator('[data-testid="invoice-preview-pane"]').isVisible();
      if (!paneStill) failures.push("invoice_eye_preview_pane_missing");

      const paneTxt = await page
        .locator('[data-testid="invoice-preview-pane"]')
        .innerText()
        .catch(() => "");
      if (
        paneTxt &&
        paneTxt.trim().length > 0 &&
        !/preview|invoice|customer|sar|tax|document|total|due/i.test(paneTxt) &&
        paneTxt.trim().length < 40
      ) {
        failures.push("preview_panel_content_weak");
      }

      await page
        .screenshot({
          path: path.join(SHOTS, "invoices-register-with-preview.png"),
          fullPage: true,
        })
        .catch(() =>
          failures.push("screenshot_missing:invoices-register-with-preview"),
        );
    } else {
      failures.push("no_invoice_rows:skip_invoice_previewAssertions");
      await page
        .screenshot({
          path: path.join(SHOTS, "invoices-register-with-preview.png"),
          fullPage: true,
        })
        .catch(() => {});
    }

    const probeUrls = [
      `${BASE}/api/workspace/sales-documents?mode=preview&type=credit_note`,
      `${BASE}/api/workspace/sales-documents?mode=preview&type=debit_note`,
      `${BASE}/api/workspace/purchase-documents?mode=preview&type=purchase_order`,
      `${BASE}/api/workspace/reports/vat-received-line-details?mode=preview`,
      `${BASE}/api/workspace/reports/cash-flow?mode=preview`,
    ];

    for (const pu of probeUrls) {
      const res = await page.request.get(pu, { timeout: 30_000 });
      const status = res.status();
      previewProbeResults.push({ url: pu, status });
      if (status === 403) failures.push(`preview_endpoint_403:${pu}`);
      if ([404, 500].includes(status)) failures.push(`preview_endpoint_bad:${status}:${pu}`);
    }

    await page.goto(`${BASE}/workspace/user/reports/cash-flow`, {
      waitUntil: "domcontentloaded",
      timeout: 180_000,
    });
    await page.waitForTimeout(900);
    await page
      .screenshot({
        path: path.join(SHOTS, "page-cash-flow.png"),
        fullPage: true,
      })
      .catch(() => failures.push("screenshot_missing:cash-flow"));

    await page.goto(`${BASE}/workspace/user/reports/vat-summary`, {
      waitUntil: "domcontentloaded",
      timeout: 180_000,
    });
    await page.waitForTimeout(900);
    await page
      .screenshot({
        path: path.join(SHOTS, "page-vat-summary.png"),
        fullPage: true,
      })
      .catch(() => failures.push("screenshot_missing:vat-summary"));

    await page.goto(`${BASE}/workspace/user/reconciliation`, {
      waitUntil: "domcontentloaded",
      timeout: 180_000,
    });
    await page.waitForTimeout(900);
    await page
      .screenshot({
        path: path.join(SHOTS, "page-reconciliation.png"),
        fullPage: true,
      })
      .catch(() => failures.push("screenshot_missing:reconciliation"));
  } catch (e) {
    failures.push(String(e?.message ?? e));
  } finally {
    await browser.close();
  }

  const report = {
    baseUrl: BASE,
    artifactOut: OUT,
    failures,
    previewProbeResults,
    networkProblems,
    consoleErrors: [...new Set(consoleErrors)].slice(0, 120),
    pass: failures.length === 0,
    completedAt: new Date().toISOString(),
  };

  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  console.log(report.pass ? "UI_BROWSER_PASS" : "UI_BROWSER_FAIL");
  if (!report.pass) {
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
}

main();
