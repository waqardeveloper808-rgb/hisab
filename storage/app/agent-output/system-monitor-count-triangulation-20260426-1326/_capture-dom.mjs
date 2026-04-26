import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPng = join(__dirname, "browser-ui-core-system.png");
const outJson = join(__dirname, "browser-ui-dom-snapshot.json");

const b = await chromium.launch();
const p = await b.newPage();
await p.goto("http://127.0.0.1:3000/system/master-design", { waitUntil: "domcontentloaded", timeout: 120000 });
await p.waitForSelector('[data-inspector-system-tree-card="core-system"]', { timeout: 60000 });
const el = p.locator('[data-inspector-system-tree-card="core-system"]').first();
const dom = await el.evaluate((node) => {
  const readMetric = (kind) => {
    const btn = node.querySelector(`[data-metric-kind="${kind}"]`);
    if (!btn) return null;
    const ps = btn.querySelectorAll("p");
    return ps[ps.length - 1]?.textContent?.trim() ?? null;
  };
  const text = node.textContent ?? "";
  const m = text.match(/Engine CP total \(this row\):\s*(\d+)/);
  return {
    totalCp: m ? m[1] : null,
    pass: readMetric("pass"),
    fail: readMetric("fail"),
    partial: readMetric("partial"),
    blocked: readMetric("blocked"),
    healthPercent: readMetric("health"),
  };
});
const pageUrl = p.url();
await p.screenshot({ path: outPng, fullPage: false });
await b.close();
const payload = { capturedAt: new Date().toISOString(), url: pageUrl, dom, screenshot: outPng };
writeFileSync(outJson, JSON.stringify(payload, null, 2), "utf8");
console.log(JSON.stringify({ dom, screenshot: String(outPng) }, null, 2));
