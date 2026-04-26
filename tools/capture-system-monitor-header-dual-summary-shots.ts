/**
 * Artifact screenshots: System Monitor summary strip (Summary = sum of main group rows).
 * Requires Next dev on PORT (default 3000).
 *
 * Usage: npx tsx tools/capture-system-monitor-header-dual-summary-shots.ts --out "C:\path\to\dir"
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180_000 });
  await page.waitForSelector("[data-inspector-system-monitor]", { timeout: 120_000 });

  await page.screenshot({ path: path.join(outDir, "before-summary-confusion.png"), fullPage: true });

  await page.locator("[data-inspector-system-monitor-summary]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, "after-two-summary-sections.png"), fullPage: true });

  await page.locator('[data-inspector-system-monitor-summary-visible="visible-fail"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, "after-visible-module-map-fail-click.png"), fullPage: true });

  await page.locator("[data-inspector-system-monitor-clear-filters]").scrollIntoViewIfNeeded();
  await page.locator("[data-inspector-system-monitor-clear-filters]").click();
  await page.waitForTimeout(250);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
