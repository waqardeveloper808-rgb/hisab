#!/usr/bin/env node
/**
 * Prompt 4C browser smoke: captures HTTP status, console errors, failed responses,
 * and screenshots per workspace route (no auth — documents unauthenticated UX).
 */

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE = process.env.PROMPT4C_BASE ?? "http://localhost:3000";

const REPORT_DIR =
  process.env.PROMPT4C_REPORT_DIR ?? path.join(__dirname, "..", "reports");
const SCREENSHOT_DIR =
  process.env.PROMPT4C_SCREENSHOT_DIR ??
  path.join(__dirname, "..", "screenshots");

const ROUTES = [
  "/workspace/reports/registers",
  "/workspace/user/quotations",
  "/workspace/user/proforma-invoices",
  "/workspace/user/credit-notes",
  "/workspace/user/debit-notes",
  "/workspace/user/purchase-orders",
  "/workspace/user/reports/vat-summary",
  "/workspace/user/reports/trial-balance",
  "/workspace/user/reports/cash-flow",
  "/workspace/user/vat",
  "/workspace/user/import",
  "/workspace/user/reconciliation",
];

/** Heuristic: obvious placeholder / stub copy (not a verdict on business logic). */
const PLACEHOLDER_PATTERNS =
  /coming soon|under construction|lorem ipsum|todo:|tbd\b|sample data only|static demo/i;

async function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const results = [];

  for (const route of ROUTES) {
    const consoleErrors = [];
    const networkErrors = [];
    const page = await context.newPage();

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(String(msg.text()));
      }
    });

    page.on("response", async (res) => {
      const u = res.url();
      if (!u.startsWith(BASE)) return;
      try {
        const st = res.status();
        if (st >= 400) {
          networkErrors.push({ url: u, status: st, route });
        }
      } catch {
        /* ignore */
      }
    });

    const url = `${BASE.replace(/\/$/, "")}${route}`;
    let status = 0;
    let bodyText = "";
    let screenshotAbs = "";
    let visibleProof = "unknown";
    let placeholderWarning = false;

    try {
      const navigated = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      status = navigated?.status() ?? 0;
      await new Promise((r) => setTimeout(r, 800));
      bodyText = await page.locator("body").innerText().catch(() => "");
      placeholderWarning = PLACEHOLDER_PATTERNS.test(bodyText);

      const tableRows = await page.locator("table tbody tr").count().catch(() => 0);
      const listRows = await page.locator("[role='row']").count().catch(() => 0);
      const cards = await page.locator('[class*="Card"]').count().catch(() => 0);

      if (tableRows > 0 || listRows >= 3 || cards >= 2) {
        visibleProof = "list_or_table_or_cards";
      } else if (bodyText.length > 200) {
        visibleProof = "substantial_text";
      } else {
        visibleProof = "minimal_or_empty_shell";
      }

      const slug = route.replace(/[^\w-]+/g, "_").replace(/^_|_$/g, "") || "home";
      screenshotAbs = path.join(SCREENSHOT_DIR, `prompt4c-${slug}.png`);
      await page.screenshot({ path: screenshotAbs, fullPage: true }).catch(() => {
        screenshotAbs = "";
      });
    } catch (e) {
      status = status || 0;
      consoleErrors.push(String(e?.message ?? e));
    } finally {
      await page.close();
    }

    const verdictParts = [];
    if (status >= 400) verdictParts.push("http_error");
    else if (status >= 200) verdictParts.push("http_ok");
    if (consoleErrors.length) verdictParts.push("console_errors");
    if (networkErrors.length) verdictParts.push("network_errors");
    if (placeholderWarning) verdictParts.push("placeholder_suspect");

    results.push({
      route,
      url,
      httpStatus: status,
      screenshotPath: screenshotAbs,
      consoleErrors,
      networkErrors,
      visibleTableListCardProof: visibleProof,
      placeholderOrFakeContentWarning: placeholderWarning,
      heuristicVerdict: verdictParts.length ? verdictParts.join(", ") : "captured",
    });
  }

  await browser.close();

  const outPath = path.join(REPORT_DIR, "browser-validation.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        baseUrl: BASE,
        generatedAt: new Date().toISOString(),
        routes: results,
      },
      null,
      2
    ),
    "utf8"
  );

  // eslint-disable-next-line no-console -- CLI progress
  console.log(`Wrote ${outPath}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console -- fatal
  console.error(e);
  process.exitCode = 1;
});
