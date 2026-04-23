import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3006";
const outputDir = process.env.OUTPUT_DIR
  ? path.resolve(process.env.OUTPUT_DIR)
  : path.join(process.cwd(), "artifacts", "product_design_pages");

const routes = [
  { name: "dashboard", route: "/workspace/dashboard" },
  { name: "invoice-register", route: "/workspace/user/invoices" },
  { name: "invoice-detail", route: "/workspace/invoices/2153" },
  { name: "invoice-editor", route: "/workspace/invoices/new?documentType=tax_invoice" },
  { name: "template-studio", route: "/workspace/user/document-templates" },
  { name: "products", route: "/workspace/user/products" },
  { name: "stock", route: "/workspace/user/stock" },
  { name: "payments", route: "/workspace/user/payments" },
  { name: "journal-entries", route: "/workspace/user/journal-entries" },
  { name: "vat-summary", route: "/workspace/user/vat" },
  { name: "profit-loss", route: "/workspace/user/reports/profit-loss" },
  { name: "balance-sheet", route: "/workspace/user/reports/balance-sheet" },
  { name: "customers", route: "/workspace/user/customers" },
];

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
  const page = await context.newPage();
  const screenshotsDir = path.join(outputDir, "screenshots");
  const reportPath = path.join(outputDir, "page-capture-report.json");

  await ensureDir(screenshotsDir);

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    outputDir,
    pages: [],
    failures: [],
  };

  for (const entry of routes) {
    try {
      await page.goto(`${baseUrl}${entry.route}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      const filePath = path.join(screenshotsDir, `${entry.name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      report.pages.push({
        name: entry.name,
        route: entry.route,
        screenshotPath: filePath,
        title: await page.title(),
      });
    } catch (error) {
      report.failures.push({
        name: entry.name,
        route: entry.route,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));

  await context.close();
  await browser.close();
}

await main();