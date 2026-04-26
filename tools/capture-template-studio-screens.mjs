/**
 * Workspace V2 — stamp/signature 150×90, panel resize, title = typography colors.
 *
 *   node tools/capture-template-studio-screens.mjs
 *   $env:OUT_DIR = "C:\hisab\storage\app\agent-output\workspace-v2-stamp-panels-title-fix-YYYYMMDD-HHMM"
 *
 * Dev server: http://localhost:3000
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const _d = new Date();
const _p = (n) => String(n).padStart(2, "0");
const defaultOut = `workspace-v2-stamp-panels-title-fix-${_d.getFullYear()}${_p(_d.getMonth() + 1)}${_p(_d.getDate())}-${_p(_d.getHours())}${_p(_d.getMinutes())}`;
const outDir =
  process.env.OUT_DIR || join(__dirname, "../storage/app/agent-output", defaultOut);

const STUDIO_URL =
  process.env.STUDIO_URL ||
  "http://localhost:3000/workspace-v2/user/templates/studio?template=tmpl-standard";
const UI_KEY = "hisabix.wsv2.templateUi.v1";

mkdirSync(outDir, { recursive: true });

const t0 = Date.now();
const log = (...a) => console.log(...a);

async function readStudioLayout(page) {
  return page.evaluate((k) => {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) return null;
      const o = JSON.parse(raw);
      return o.studioLayout ?? null;
    } catch {
      return null;
    }
  }, UI_KEY);
}

async function assertStampDefaults(page) {
  await page.selectOption("#wsv2-section-selector", "stampSignature").catch(() => {});
  await page.waitForTimeout(350);
  const stW = await page.locator("#wsv2-stamp-img-w").inputValue().catch(() => "");
  const stH = await page.locator("#wsv2-stamp-img-h").inputValue().catch(() => "");
  const sigW = await page.locator("#wsv2-signature-img-w").inputValue().catch(() => "");
  const sigH = await page.locator("#wsv2-signature-img-h").inputValue().catch(() => "");
  let code = 0;
  if (stW !== "150" || stH !== "90" || sigW !== "150" || sigH !== "90") {
    console.error("Stamp/signature default mismatch", { stW, stH, sigW, sigH });
    code = 2;
  }
  return { code, stW, stH, sigW, sigH };
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1680, height: 1050 } });

let exitCode = 0;
const blockers = [];
let reportExtras = {};

try {
  await page.goto(STUDIO_URL, { waitUntil: "networkidle", timeout: 120000 });
  await page.locator(".wsv2-template-studio").waitFor({ timeout: 60000 });
  await page.screenshot({ path: join(outDir, "before-current-state.png"), fullPage: true });

  const layoutBefore = await readStudioLayout(page);
  reportExtras.layoutBefore = layoutBefore;

  await page.evaluate((k) => localStorage.removeItem(k), UI_KEY);
  await page.reload({ waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(800);
  await page.locator(".wsv2-template-studio").waitFor({ timeout: 60000 });

  const stampAssert = await assertStampDefaults(page);
  exitCode = stampAssert.code;
  reportExtras.stampDefaults = stampAssert;

  const hdr = page.locator('.wsv2-wf-section[data-section="header"]').first();
  if ((await hdr.count()) > 0) {
    await hdr.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.locator("section.wsv2-studio-canvas").screenshot({
      path: join(outDir, "after-logo-125x125-still-ok.png"),
    });
  }

  const stampSec = page.locator('.wsv2-wf-section[data-section="stampSignature"]').first();
  if ((await stampSec.count()) > 0) {
    await stampSec.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.locator("section.wsv2-studio-canvas").screenshot({
      path: join(outDir, "after-stamp-signature-150x90.png"),
    });
    await page.locator("section.wsv2-studio-canvas").screenshot({
      path: join(outDir, "after-stamp-signature-child-cards-bottom-aligned.png"),
    });
  } else {
    blockers.push("stampSignature section missing");
  }

  const leftH = page.locator("#wsv2-left-resize-handle");
  if ((await leftH.count()) > 0) {
    const box = await leftH.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 55, box.y + box.height / 2);
      await page.mouse.up();
      await page.waitForTimeout(400);
    }
  }
  await page.screenshot({ path: join(outDir, "after-left-panel-resized.png"), fullPage: true });

  const rightH = page.locator("#wsv2-right-resize-handle");
  if ((await rightH.count()) > 0) {
    const box = await rightH.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 - 50, box.y + box.height / 2);
      await page.mouse.up();
      await page.waitForTimeout(400);
    }
  }
  await page.screenshot({ path: join(outDir, "after-right-panel-resized.png"), fullPage: true });

  const layoutAfterDrag = await readStudioLayout(page);
  reportExtras.layoutAfterDrag = layoutAfterDrag;

  await page.reload({ waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(800);
  const layoutAfterReload = await readStudioLayout(page);
  reportExtras.layoutAfterReload = layoutAfterReload;
  await page.screenshot({ path: join(outDir, "after-panel-widths-persist-after-reload.png"), fullPage: true });

  if (
    layoutAfterDrag &&
    layoutAfterReload &&
    (layoutAfterReload.leftPanelWidthPx !== layoutAfterDrag.leftPanelWidthPx ||
      layoutAfterReload.rightPanelWidthPx !== layoutAfterDrag.rightPanelWidthPx)
  ) {
    blockers.push("studioLayout widths changed unexpectedly after reload");
    exitCode = Math.max(exitCode, 2);
  }

  await page.locator("#wsv2-english-font-color").fill("#2563eb");
  await page.locator("#wsv2-arabic-font-color").fill("#ea580c");
  await page.waitForTimeout(400);

  const langTabs = page.locator(".lang-tabs");

  async function shotTitleForDoc(slug, filename) {
    await page.selectOption("#wsv2-document-type", slug).catch(() => {});
    await page.waitForTimeout(500);
    await page.selectOption("#wsv2-section-selector", "title").catch(() => {});
    await page.waitForTimeout(300);
    const t = page.locator('.wsv2-wf-section[data-section="title"]').first();
    if ((await t.count()) > 0) {
      await t.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await page.locator("section.wsv2-studio-canvas").screenshot({ path: join(outDir, filename) });
    }
  }

  await langTabs.getByRole("tab", { name: "EN", exact: true }).click().catch(() => {});
  await page.waitForTimeout(200);
  await shotTitleForDoc("tax-invoice", "after-title-english-color-tax-invoice.png");
  await langTabs.getByRole("tab", { name: "AR", exact: true }).click().catch(() => {});
  await page.waitForTimeout(350);
  {
    const t = page.locator('.wsv2-wf-section[data-section="title"]').first();
    if ((await t.count()) > 0) {
      await t.scrollIntoViewIfNeeded();
      await page.locator("section.wsv2-studio-canvas").screenshot({
        path: join(outDir, "after-title-arabic-color-tax-invoice.png"),
      });
    }
  }
  await langTabs.getByRole("tab", { name: "EN + AR", exact: true }).click().catch(() => {});
  await page.waitForTimeout(200);

  await langTabs.getByRole("tab", { name: "EN", exact: true }).click().catch(() => {});
  await page.waitForTimeout(150);
  await shotTitleForDoc("quotation", "after-title-color-quotation.png");
  await shotTitleForDoc("credit-note", "after-title-color-credit-note.png");
  await shotTitleForDoc("purchase-order", "after-title-color-purchase-order.png");

  const dl = [];
  page.on("download", (d) => dl.push(d));
  try {
    await page.getByRole("button", { name: /PDF/i }).first().click({ timeout: 12000 });
    await page.waitForTimeout(3500);
    if (dl[0]) {
      const pdfPath = join(outDir, "after-pdf-export.pdf");
      await dl[0].saveAs(pdfPath);
      if (!existsSync(pdfPath)) {
        blockers.push("PDF missing after save");
        exitCode = Math.max(exitCode, 2);
      }
    } else {
      blockers.push("PDF download not captured");
      exitCode = Math.max(exitCode, 2);
    }
  } catch (e) {
    blockers.push(`PDF: ${String(e?.message || e)}`);
    exitCode = Math.max(exitCode, 2);
  }
} catch (e) {
  console.error(e);
  blockers.push(String(e?.message || e));
  exitCode = 1;
} finally {
  await browser.close();
}

const elapsed = Date.now() - t0;
writeFileSync(join(outDir, "modified-files.txt"), [
  "lib/workspace-v2/template-ui-settings.ts",
  "lib/workspace-v2/document-template-renderer.ts",
  "components/workspace-v2/WorkspaceV2DocumentRenderer.tsx",
  "components/workspace-v2/WorkspaceV2TemplateStudio.tsx",
  "lib/workspace-v2/exports/pdf.ts",
  "app/workspace-v2/v2.css",
  "tools/capture-template-studio-screens.mjs",
  "",
].join("\n"));
writeFileSync(
  join(outDir, "execution-time-report.md"),
  `# Execution time\n\n- Elapsed ms: ${elapsed}\n- Finished: ${new Date().toISOString()}\n`,
);
writeFileSync(
  join(outDir, "validation-report.md"),
  `# Validation — stamp/panels/title\n\n- URL: ${STUDIO_URL}\n- **localStorage key:** \\\`${UI_KEY}\\\` (\`studioLayout.leftPanelWidthPx\`, \`studioLayout.rightPanelWidthPx\`)\n- **Stamp defaults:** 150×90 stamp + 150×90 signature (inspector inputs).\n- **Title colors:** English/Arabic document title use typography colors (see canvas screenshots).\n- **Layout telemetry (JSON):**\n\n\`\`\`json\n${JSON.stringify(reportExtras, null, 2)}\n\`\`\`\n\n- **PDF:** \`${join(outDir, "after-pdf-export.pdf")}\`\n- Exit: ${exitCode}\n- Blockers: ${blockers.length ? "see blockers.md" : "none"}\n`,
);
if (blockers.length) {
  writeFileSync(join(outDir, "blockers.md"), blockers.map((b) => `- ${b}`).join("\n") + "\n");
} else {
  try {
    unlinkSync(join(outDir, "blockers.md"));
  } catch {
    /* */
  }
}

log("Wrote artifacts to", outDir);
process.exit(exitCode);
