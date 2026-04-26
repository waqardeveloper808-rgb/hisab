/**
 * Playwright capture for System Monitor validation artifacts.
 * Requires: next dev on PORT (default 3000).
 *
 * Usage: npx tsx tools/capture-system-monitor-artifact-shots.ts --out "C:\path\to\artifact-dir"
 */
import { chromium } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";

function argOut(): string {
  const i = process.argv.indexOf("--out");
  if (i === -1 || !process.argv[i + 1]) {
    throw new Error("Missing --out <directory>");
  }
  return path.resolve(process.argv[i + 1]);
}

async function main() {
  const outDir = argOut();
  fs.mkdirSync(outDir, { recursive: true });
  const port = process.env.PORT || "3000";
  const url = `http://127.0.0.1:${port}/system/master-design`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180_000 });
  await page.waitForSelector("[data-inspector-system-monitor]", { timeout: 120_000 });

  await page.screenshot({ path: path.join(outDir, "before-system-monitor.png"), fullPage: true });

  await page.locator("[data-inspector-system-monitor-summary]").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(outDir, "after-global-summary.png"), fullPage: true });

  await page.locator('[data-inspector-system-tree-card="core-system"] [data-metric-kind="fail"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "after-core-system-fail-click.png"), fullPage: true });

  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.waitForTimeout(200);

  await page.locator('[data-inspector-system-tree-card="finance-engines"] [data-metric-kind="fail"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "after-finance-engines-fail-click.png"), fullPage: true });

  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.waitForTimeout(200);

  await page.locator('[data-inspector-system-tree-card="platform-layers"] [data-metric-kind="pass"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "after-platform-layers-pass-click.png"), fullPage: true });

  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.waitForTimeout(200);

  await page.locator('[data-inspector-system-tree-card="identity-workspace"] [data-metric-kind="fail"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "after-subcategory-click-still-working.png"), fullPage: true });

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
