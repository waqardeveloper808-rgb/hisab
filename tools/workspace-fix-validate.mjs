import { chromium } from "playwright";
import fs from "node:fs/promises";

const artifact = process.argv[2];
const baseUrl = "http://127.0.0.1:3006";
const validation = {
  HAS_WORKSPACE_ERROR: 0,
  DASHBOARD_REQUEST: 0,
  REPORTS_REQUEST: 0,
  FINAL_URL: "",
  REFRESH_URL: "",
  NOTES: []
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await context.newPage();

page.on("console", (msg) => {
  const text = msg.text();
  if (text.includes("Workspace session is required") || text.includes("getDashboardSnapshot failed") || text.includes("getReportsSnapshot failed")) {
    validation.HAS_WORKSPACE_ERROR = 1;
    validation.NOTES.push(`console:${text}`);
  }
});

page.on("response", (response) => {
  const url = response.url();
  if (url.includes("/api/workspace/reports/dashboard-summary")) {
    validation.DASHBOARD_REQUEST = response.status();
  }
  if (url.includes("/api/workspace/reports/vat-summary")) {
    validation.REPORTS_REQUEST = response.status();
  }
});

await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
await page.fill('input[name="email"]', "demo@gulfhisab.local");
await page.fill('input[name="password"]', "demo123");
await Promise.all([
  page.waitForURL(/\/workspace\/user/, { timeout: 30000 }),
  page.click('button[type="submit"]')
]);

await page.waitForTimeout(2500);
validation.FINAL_URL = page.url();

await page.screenshot({ path: `${artifact}/workspace-open.png`, fullPage: true });

await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(2000);
validation.REFRESH_URL = page.url();

if (!validation.REFRESH_URL.includes("/workspace/")) {
  validation.HAS_WORKSPACE_ERROR = 1;
  validation.NOTES.push(`refresh-url:${validation.REFRESH_URL}`);
}

await page.screenshot({ path: `${artifact}/refresh-ok.png`, fullPage: true });

const lines = [
  `HAS_WORKSPACE_ERROR ${validation.HAS_WORKSPACE_ERROR}`,
  `DASHBOARD_REQUEST ${validation.DASHBOARD_REQUEST}`,
  `REPORTS_REQUEST ${validation.REPORTS_REQUEST}`,
  `FINAL_URL ${validation.FINAL_URL}`,
  `REFRESH_URL ${validation.REFRESH_URL}`,
];
if (validation.NOTES.length > 0) {
  lines.push("NOTES");
  lines.push(...validation.NOTES);
}
await fs.writeFile(`${artifact}/validation.txt`, `${lines.join("\n")}\n`, "utf8");

await browser.close();
console.log(artifact);
