const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const outDir = path.join(process.cwd(), "qa_reports");
  await page.goto("http://localhost:3001/workspace/user/stock", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, "inventory-screen-2026-04-17.png"), fullPage: true });
  await browser.close();
})();
