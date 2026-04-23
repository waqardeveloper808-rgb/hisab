import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const svgPath = path.join(root, "public", "branding", "gulf-hisab-main-logo.svg");
const pngPath = path.join(root, "public", "branding", "gulf-hisab-main-logo.png");

const html = `<!doctype html>
<html>
  <body style="margin:0; background:transparent; display:flex; align-items:center; justify-content:center; width:900px; height:240px;">
    <img src="file:///${svgPath.replace(/\\/g, "/")}" style="width:820px; height:auto; object-fit:contain;" />
  </body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 240 }, deviceScaleFactor: 2 });
await mkdir(path.dirname(pngPath), { recursive: true });
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({ path: pngPath, omitBackground: true });
await browser.close();
console.log(pngPath);
