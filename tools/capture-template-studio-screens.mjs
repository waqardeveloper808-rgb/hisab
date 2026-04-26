/**
 * Workspace V2 — Playwright capture / validation.
 *
 * Stamp / panels / title suite (default):
 *   node tools/capture-template-studio-screens.mjs
 *
 * Totals amount column default = 117:
 *   node tools/capture-template-studio-screens.mjs totals-amount-117
 *   # or: $env:WSV2_CAPTURE_SUITE='totals-amount-117'; node tools/capture-template-studio-screens.mjs
 *
 * Info cards column defaults = 150 / 250 / 150 (EN / Value / AR):
 *   $env:WSV2_CAPTURE_SUITE='info-column-defaults-150-250-150'; node tools/capture-template-studio-screens.mjs
 *
 * Info row density (compact 0/0/0 spacing):
 *   $env:WSV2_CAPTURE_SUITE='info-row-density-fix'; node tools/capture-template-studio-screens.mjs
 *
 * Info card sizes + field switches + item heading editor:
 *   $env:WSV2_CAPTURE_SUITE='info-card-toggle-heading-editor'; node tools/capture-template-studio-screens.mjs
 *
 * Info card 3-column grid + Arabic alignment (no slack column):
 *   $env:WSV2_CAPTURE_SUITE='info-card-column-audit-fix'; node tools/capture-template-studio-screens.mjs
 *
 *   $env:OUT_DIR = "C:\hisab\storage\app\agent-output\..."
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
/** Prefer env on Windows shells where argv may not pass through. */
const suite =
  process.env.WSV2_CAPTURE_SUITE || process.argv[2] || "stamp-panels";
const dateStamp = `${_d.getFullYear()}${_p(_d.getMonth() + 1)}${_p(_d.getDate())}-${_p(_d.getHours())}${_p(_d.getMinutes())}`;
function defaultArtifactFolder(suiteName, stamp) {
  if (suiteName === "totals-amount-117") return `workspace-v2-totals-amount-width-117-${stamp}`;
  if (suiteName === "info-column-defaults-150-250-150")
    return `workspace-v2-info-column-defaults-150-250-150-${stamp}`;
  if (suiteName === "info-row-density-fix") return `workspace-v2-info-row-density-fix-${stamp}`;
  if (suiteName === "info-card-toggle-heading-editor")
    return `workspace-v2-info-card-toggle-heading-editor-${stamp}`;
  if (suiteName === "info-card-column-audit-fix")
    return `workspace-v2-info-card-column-audit-fix-${stamp}`;
  return `workspace-v2-stamp-panels-title-fix-${stamp}`;
}
const defaultOut = defaultArtifactFolder(suite, dateStamp);
const outDir =
  process.env.OUT_DIR || join(__dirname, "../storage/app/agent-output", defaultOut);

const STUDIO_URL =
  process.env.STUDIO_URL ||
  "http://localhost:3000/workspace-v2/user/templates/studio?template=tmpl-standard";
const UI_KEY = "hisabix.wsv2.templateUi.v1";
/** Inspector aside — section controls (toggles, card layout) live here, not in `.wsv2-section-control-panel`. */
const STUDIO_INSPECTOR = "aside.wsv2-studio-right";

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

/** @returns {Promise<{ exitCode: number, blockers: string[], reportExtras: object }>} */
async function runTotalsAmount117Suite(page, outDir) {
  let exitCode = 0;
  const blockers = [];
  const reportExtras = {};

  try {
    await page.goto(STUDIO_URL, { waitUntil: "networkidle", timeout: 120000 });
    await page.locator(".wsv2-template-studio").waitFor({ timeout: 60000 });

    await page.selectOption("#wsv2-section-selector", "totals").catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, "before-totals-amount-width.png"), fullPage: true });

    await page.evaluate((k) => localStorage.removeItem(k), UI_KEY);
    await page.reload({ waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(800);
    await page.locator(".wsv2-template-studio").waitFor({ timeout: 60000 });

    await page.selectOption("#wsv2-section-selector", "totals").catch(() => {});
    await page.waitForTimeout(450);
    const afterClean = await page.locator("#wsv2-totals-col-amount").inputValue().catch(() => "");
    reportExtras.cleanLocalStorageAmountColumnPx = afterClean;
    if (afterClean !== "117") {
      blockers.push(`Expected Amount column 117 after clean localStorage, got ${afterClean}`);
      exitCode = Math.max(exitCode, 2);
    }
    await page.screenshot({ path: join(outDir, "after-totals-amount-width-117.png"), fullPage: true });

    const totalsSec = page.locator('.wsv2-wf-section[data-section="totals"]').first();
    if ((await totalsSec.count()) > 0) {
      await totalsSec.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await page.locator("section.wsv2-studio-canvas").screenshot({
        path: join(outDir, "after-preview-totals-canvas.png"),
      });
    } else {
      blockers.push("totals section missing on canvas");
      exitCode = Math.max(exitCode, 2);
    }

    await page.locator("#wsv2-totals-col-amount").fill("888");
    await page.locator("label[for='wsv2-totals-col-desc']").click();
    await page.waitForTimeout(350);
    reportExtras.amountAfterUserEdit = await page.locator("#wsv2-totals-col-amount").inputValue();

    page.once("dialog", (d) => d.accept());
    await page.locator("button.wsv2-reset-defaults").click();
    await page.waitForTimeout(600);
    await page.selectOption("#wsv2-section-selector", "totals").catch(() => {});
    await page.waitForTimeout(350);
    const afterReset = await page.locator("#wsv2-totals-col-amount").inputValue().catch(() => "");
    reportExtras.afterResetStudioDefaultsAmountColumnPx = afterReset;
    if (afterReset !== "117") {
      blockers.push(`Expected Amount column 117 after Reset studio defaults, got ${afterReset}`);
      exitCode = Math.max(exitCode, 2);
    }

    const dl = [];
    page.on("download", (d) => dl.push(d));
    try {
      await page.getByRole("button", { name: /PDF/i }).first().click({ timeout: 12000 });
      await page.waitForTimeout(3500);
      if (dl[0]) {
        const pdfPath = join(outDir, "after-pdf-export-totals-117.pdf");
        await dl[0].saveAs(pdfPath);
        if (!existsSync(pdfPath)) {
          blockers.push("PDF missing after save");
          exitCode = Math.max(exitCode, 2);
        } else {
          reportExtras.pdfPath = pdfPath;
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
  }

  return { exitCode, blockers, reportExtras };
}

/** @returns {Promise<{ exitCode: number, blockers: string[], reportExtras: object }>} */
async function runInfoColumnDefaults150250150Suite(page, outDir) {
  let exitCode = 0;
  const blockers = [];
  const reportExtras = {};
  const EN = "150";
  const VAL = "250";
  const AR = "150";

  try {
    await page.goto(STUDIO_URL, { waitUntil: "networkidle", timeout: 120000 });
    await page.locator(".wsv2-template-studio").waitFor({ timeout: 60000 });
    await page.screenshot({ path: join(outDir, "before-info-column-defaults.png"), fullPage: true });

    await page.evaluate((k) => localStorage.removeItem(k), UI_KEY);
    await page.reload({ waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(800);
    await page.locator(".wsv2-template-studio").waitFor({ timeout: 60000 });

    async function readCustomerWidths() {
      await page.selectOption("#wsv2-section-selector", "customer").catch(() => {});
      await page.waitForTimeout(400);
      const en = await page.locator("#wsv2-customer-en-col-width").inputValue().catch(() => "");
      const val = await page.locator("#wsv2-customer-value-col-width").inputValue().catch(() => "");
      const ar = await page.locator("#wsv2-customer-ar-col-width").inputValue().catch(() => "");
      return { en, val, ar };
    }
    async function readDocInfoWidths() {
      await page.selectOption("#wsv2-section-selector", "docInfo").catch(() => {});
      await page.waitForTimeout(400);
      const en = await page.locator("#wsv2-docinfo-en-col-width").inputValue().catch(() => "");
      const val = await page.locator("#wsv2-docinfo-value-col-width").inputValue().catch(() => "");
      const ar = await page.locator("#wsv2-docinfo-ar-col-width").inputValue().catch(() => "");
      return { en, val, ar };
    }

    const cleanCust = await readCustomerWidths();
    reportExtras.cleanLocalStorageCustomer = cleanCust;
    if (cleanCust.en !== EN || cleanCust.val !== VAL || cleanCust.ar !== AR) {
      blockers.push(
        `Clean load (customer inspector): expected EN/Value/AR ${EN}/${VAL}/${AR}, got ${cleanCust.en}/${cleanCust.val}/${cleanCust.ar}`,
      );
      exitCode = Math.max(exitCode, 2);
    }

    const cleanDoc = await readDocInfoWidths();
    reportExtras.cleanLocalStorageDocInfo = cleanDoc;
    if (cleanDoc.en !== EN || cleanDoc.val !== VAL || cleanDoc.ar !== AR) {
      blockers.push(
        `Clean load (docInfo inspector): expected EN/Value/AR ${EN}/${VAL}/${AR}, got ${cleanDoc.en}/${cleanDoc.val}/${cleanDoc.ar}`,
      );
      exitCode = Math.max(exitCode, 2);
    }

    await page.screenshot({ path: join(outDir, "after-info-column-defaults-150-250-150.png"), fullPage: true });

    const customerSec = page.locator('.wsv2-wf-section[data-section="customer"]').first();
    if ((await customerSec.count()) > 0) {
      await customerSec.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await page.locator("section.wsv2-studio-canvas").screenshot({
        path: join(outDir, "after-preview-customer-info-canvas.png"),
      });
    } else {
      blockers.push("customer section missing on canvas");
      exitCode = Math.max(exitCode, 2);
    }

    const docInfoSec = page.locator('.wsv2-wf-section[data-section="docInfo"]').first();
    if ((await docInfoSec.count()) > 0) {
      await docInfoSec.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await page.locator("section.wsv2-studio-canvas").screenshot({
        path: join(outDir, "after-preview-docinfo-canvas.png"),
      });
    } else {
      blockers.push("docInfo section missing on canvas");
      exitCode = Math.max(exitCode, 2);
    }

    await page.selectOption("#wsv2-section-selector", "customer").catch(() => {});
    await page.waitForTimeout(300);
    await page.locator("#wsv2-customer-en-col-width").fill("99");
    await page.locator("#wsv2-customer-value-col-width").fill("400");
    await page.locator("#wsv2-customer-ar-col-width").fill("88");
    await page.locator("label[for='wsv2-customer-en-col-width']").click();
    await page.waitForTimeout(350);

    page.once("dialog", (d) => d.accept());
    await page.locator("button.wsv2-reset-defaults").click();
    await page.waitForTimeout(600);

    const resetCust = await readCustomerWidths();
    reportExtras.afterResetCustomer = resetCust;
    if (resetCust.en !== EN || resetCust.val !== VAL || resetCust.ar !== AR) {
      blockers.push(
        `After reset (customer): expected EN/Value/AR ${EN}/${VAL}/${AR}, got ${resetCust.en}/${resetCust.val}/${resetCust.ar}`,
      );
      exitCode = Math.max(exitCode, 2);
    }

    const resetDoc = await readDocInfoWidths();
    reportExtras.afterResetDocInfo = resetDoc;
    if (resetDoc.en !== EN || resetDoc.val !== VAL || resetDoc.ar !== AR) {
      blockers.push(
        `After reset (docInfo): expected EN/Value/AR ${EN}/${VAL}/${AR}, got ${resetDoc.en}/${resetDoc.val}/${resetDoc.ar}`,
      );
      exitCode = Math.max(exitCode, 2);
    }
  } catch (e) {
    console.error(e);
    blockers.push(String(e?.message || e));
    exitCode = 1;
  }

  return { exitCode, blockers, reportExtras };
}

/** @returns {Promise<{ exitCode: number, blockers: string[], reportExtras: object }>} */
async function runInfoRowDensityFixSuite(page, outDir) {
  let exitCode = 0;
  const blockers = [];
  const reportExtras = {};

  try {
    await page.goto(STUDIO_URL, { waitUntil: "networkidle", timeout: 120000 });
    await page.locator(".wsv2-template-studio").waitFor({ timeout: 60000 });
    await page.evaluate((k) => localStorage.removeItem(k), UI_KEY);
    await page.reload({ waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(800);
    await page.locator(".wsv2-template-studio").waitFor({ timeout: 60000 });

    await page.selectOption("#wsv2-section-selector", "customer").catch(() => {});
    await page.waitForTimeout(450);

    const custSec = page.locator('.wsv2-wf-section[data-section="customer"]').first();
    const boxDef = (await custSec.count()) > 0 ? await custSec.boundingBox() : null;
    reportExtras.customerSectionHeightBefore = boxDef ? Math.round(boxDef.height) : null;

    await page.screenshot({ path: join(outDir, "before-info-row-large-gaps.png"), fullPage: true });

    await page.locator("#wsv2-client-card-padding").fill("0");
    await page.locator("#wsv2-client-row-padding-y").fill("0");
    await page.locator("#wsv2-client-row-gap").fill("0");
    await page.locator("#wsv2-client-card-min-height").fill("0");
    await page.locator("label[for='wsv2-client-card-width']").click();
    await page.waitForTimeout(500);

    const pad0 = await page.locator("#wsv2-client-card-padding").inputValue();
    const py0 = await page.locator("#wsv2-client-row-padding-y").inputValue();
    const gap0 = await page.locator("#wsv2-client-row-gap").inputValue();
    reportExtras.inspectorCardPaddingPx = pad0;
    reportExtras.inspectorRowPaddingYPx = py0;
    reportExtras.inspectorRowGapPx = gap0;
    if (pad0 !== "0" || py0 !== "0" || gap0 !== "0") {
      blockers.push(`Expected spacing 0/0/0, got pad=${pad0} rowPy=${py0} gap=${gap0}`);
      exitCode = Math.max(exitCode, 2);
    }

    await page.screenshot({ path: join(outDir, "after-row-gap-0-padding-0-compact.png"), fullPage: true });

    if ((await custSec.count()) > 0) {
      await custSec.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const boxCompact = await custSec.boundingBox();
      reportExtras.customerSectionHeightCompact = boxCompact ? Math.round(boxCompact.height) : null;
      await page.locator("section.wsv2-studio-canvas").screenshot({
        path: join(outDir, "after-client-info-compact.png"),
      });
    } else {
      blockers.push("customer section missing on canvas");
      exitCode = Math.max(exitCode, 2);
    }

    await page.selectOption("#wsv2-section-selector", "docInfo").catch(() => {});
    await page.waitForTimeout(400);

    const docSec = page.locator('.wsv2-wf-section[data-section="docInfo"]').first();
    if ((await docSec.count()) > 0) {
      await docSec.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const db = await docSec.boundingBox();
      reportExtras.documentSectionHeightCompact = db ? Math.round(db.height) : null;
      await page.locator("section.wsv2-studio-canvas").screenshot({
        path: join(outDir, "after-document-info-compact.png"),
      });
    } else {
      blockers.push("docInfo section missing on canvas");
      exitCode = Math.max(exitCode, 2);
    }

    if (
      reportExtras.customerSectionHeightBefore != null &&
      reportExtras.customerSectionHeightCompact != null &&
      reportExtras.customerSectionHeightCompact >= reportExtras.customerSectionHeightBefore - 2
    ) {
      blockers.push(
        `Expected customer card to shrink measurably with 0/0/0 spacing (before=${reportExtras.customerSectionHeightBefore} compact=${reportExtras.customerSectionHeightCompact})`,
      );
      exitCode = Math.max(exitCode, 2);
    }
  } catch (e) {
    console.error(e);
    blockers.push(String(e?.message || e));
    exitCode = 1;
  }

  return { exitCode, blockers, reportExtras };
}

/** @returns {Promise<{ exitCode: number, blockers: string[], reportExtras: object }>} */
async function runInfoCardToggleHeadingEditorSuite(page, outDir) {
  let exitCode = 0;
  const blockers = [];
  const reportExtras = {};

  try {
    await page.goto(STUDIO_URL, { waitUntil: "networkidle", timeout: 120000 });
    await page.locator(".wsv2-template-studio").waitFor({ timeout: 60000 });
    await page.evaluate((k) => localStorage.removeItem(k), UI_KEY);
    await page.reload({ waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(800);
    await page.locator(".wsv2-template-studio").waitFor({ timeout: 60000 });

    await page.selectOption("#wsv2-section-selector", "customer").catch(() => {});
    await page.waitForTimeout(450);
    await page.screenshot({ path: join(outDir, "before-large-info-card-spacing.png"), fullPage: true });
    await page.getByRole("heading", { name: "Customer fields" }).scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(200);
    await page
      .locator(STUDIO_INSPECTOR)
      .screenshot({ path: join(outDir, "before-awkward-toggle-buttons.png") })
      .catch(() => {});

    await page.selectOption("#wsv2-section-selector", "items").catch(() => {});
    await page.waitForTimeout(350);
    await page.screenshot({ path: join(outDir, "before-fixed-table-headings.png"), fullPage: true });

    await page.selectOption("#wsv2-section-selector", "customer").catch(() => {});
    await page.waitForTimeout(350);
    await page.screenshot({ path: join(outDir, "after-client-card-controls-visible.png"), fullPage: true });

    await page.selectOption("#wsv2-section-selector", "docInfo").catch(() => {});
    await page.waitForTimeout(350);
    await page.screenshot({ path: join(outDir, "after-document-card-controls-visible.png"), fullPage: true });

    await page.selectOption("#wsv2-section-selector", "customer").catch(() => {});
    await page.waitForTimeout(300);
    await page.locator("#wsv2-client-card-padding").fill("0");
    await page.locator("#wsv2-client-row-padding-y").fill("0");
    await page.locator("#wsv2-client-row-gap").fill("0");
    await page.locator("#wsv2-client-card-min-height").fill("0");
    await page.locator("#wsv2-client-card-height").fill("0");
    await page.locator("label[for='wsv2-client-card-width']").click();
    await page.waitForTimeout(400);
    const cust = page.locator('.wsv2-wf-section[data-section="customer"]').first();
    if ((await cust.count()) > 0) {
      await cust.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await page.locator("section.wsv2-studio-canvas").screenshot({
        path: join(outDir, "after-client-card-auto-height-compact.png"),
      });
    }

    await page.locator("#wsv2-client-card-height").fill("220");
    await page.locator("label[for='wsv2-client-card-width']").click();
    await page.waitForTimeout(450);
    if ((await cust.count()) > 0) {
      await cust.scrollIntoViewIfNeeded();
      await page.locator("section.wsv2-studio-canvas").screenshot({
        path: join(outDir, "after-client-card-fixed-height-test.png"),
      });
    }
    await page.locator("#wsv2-client-card-height").fill("0");
    await page.locator("label[for='wsv2-client-card-width']").click();
    await page.waitForTimeout(300);

    await page.selectOption("#wsv2-section-selector", "docInfo").catch(() => {});
    await page.waitForTimeout(300);
    await page.locator("#wsv2-docinfo-card-padding").fill("0");
    await page.locator("#wsv2-docinfo-row-padding-y").fill("0");
    await page.locator("#wsv2-docinfo-row-gap").fill("0");
    await page.locator("#wsv2-docinfo-card-min-height").fill("0");
    await page.locator("#wsv2-docinfo-card-height").fill("0");
    await page.locator("label[for='wsv2-docinfo-card-width']").click();
    await page.waitForTimeout(400);
    const docsec = page.locator('.wsv2-wf-section[data-section="docInfo"]').first();
    if ((await docsec.count()) > 0) {
      await docsec.scrollIntoViewIfNeeded();
      await page.locator("section.wsv2-studio-canvas").screenshot({
        path: join(outDir, "after-document-card-auto-height-compact.png"),
      });
    }
    await page.locator("#wsv2-docinfo-card-height").fill("200");
    await page.locator("label[for='wsv2-docinfo-card-width']").click();
    await page.waitForTimeout(450);
    if ((await docsec.count()) > 0) {
      await docsec.scrollIntoViewIfNeeded();
      await page.locator("section.wsv2-studio-canvas").screenshot({
        path: join(outDir, "after-document-card-fixed-height-test.png"),
      });
    }

    await page.selectOption("#wsv2-section-selector", "customer").catch(() => {});
    await page.waitForTimeout(300);
    await page.locator("#wsv2-client-card-padding").fill("0");
    await page.locator("#wsv2-client-row-padding-y").fill("0");
    await page.locator("#wsv2-client-row-gap").fill("0");
    await page.locator("label[for='wsv2-client-card-width']").click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, "after-row-gap-0-padding-0-compact.png"), fullPage: true });

    await page.getByRole("heading", { name: "Customer fields" }).scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(200);
    await page
      .locator(STUDIO_INSPECTOR)
      .screenshot({ path: join(outDir, "after-customer-field-compact-toggles.png") })
      .catch(() => {});

    const panelSwitches = page.locator(
      `${STUDIO_INSPECTOR} button[role='switch']:not([disabled])`,
    );
    let toggleSection = "customer";
    let swCount = await panelSwitches.count();
    if (swCount === 0) {
      await page.selectOption("#wsv2-section-selector", "docInfo").catch(() => {});
      await page.waitForTimeout(350);
      toggleSection = "docInfo";
      swCount = await panelSwitches.count();
    }
    reportExtras.visibilityToggleSection = toggleSection;
    reportExtras.visibilityPanelSwitchCount = swCount;

    const toggleCanvasSection = toggleSection === "docInfo" ? "docInfo" : "customer";
    const scrollToggleTarget = async () => {
      await page
        .locator(`.wsv2-wf-section[data-section="${toggleCanvasSection}"]`)
        .first()
        .scrollIntoViewIfNeeded();
    };

    if (swCount === 0) {
      blockers.push("No field visibility switches found in customer or document info panel.");
      exitCode = Math.max(exitCode, 2);
      await scrollToggleTarget();
      await page.locator("section.wsv2-studio-canvas").screenshot({
        path: join(outDir, "after-toggle-off-hides-field.png"),
      });
      await page.locator("section.wsv2-studio-canvas").screenshot({
        path: join(outDir, "after-toggle-on-shows-field.png"),
      });
    } else {
      const sw = panelSwitches.nth(0);
      const startOn = (await sw.getAttribute("aria-checked")) === "true";
      if (startOn) {
        await sw.click();
        await page.waitForTimeout(450);
        await scrollToggleTarget();
        await page.locator("section.wsv2-studio-canvas").screenshot({
          path: join(outDir, "after-toggle-off-hides-field.png"),
        });
        await sw.click();
        await page.waitForTimeout(450);
        await scrollToggleTarget();
        await page.locator("section.wsv2-studio-canvas").screenshot({
          path: join(outDir, "after-toggle-on-shows-field.png"),
        });
      } else {
        await scrollToggleTarget();
        await page.locator("section.wsv2-studio-canvas").screenshot({
          path: join(outDir, "after-toggle-off-hides-field.png"),
        });
        await sw.click();
        await page.waitForTimeout(450);
        await scrollToggleTarget();
        await page.locator("section.wsv2-studio-canvas").screenshot({
          path: join(outDir, "after-toggle-on-shows-field.png"),
        });
      }
    }

    if (toggleSection === "docInfo") {
      await page.selectOption("#wsv2-section-selector", "customer").catch(() => {});
      await page.waitForTimeout(250);
    }

    await page.selectOption("#wsv2-section-selector", "docInfo").catch(() => {});
    await page.waitForTimeout(350);
    await page.getByRole("heading", { name: "Document info fields" }).scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(200);
    await page
      .locator(STUDIO_INSPECTOR)
      .screenshot({ path: join(outDir, "after-document-field-compact-toggles.png") })
      .catch(() => {});

    await page.selectOption("#wsv2-section-selector", "items").catch(() => {});
    await page.waitForTimeout(450);
    await page.screenshot({ path: join(outDir, "after-products-heading-editor-controls.png"), fullPage: true });

    const descEn = page.locator("#wsv2-item-col-description-label-en");
    if ((await descEn.count()) > 0) {
      await descEn.fill("Item Description");
      await page.locator("#wsv2-item-col-description-label-ar").fill("وصف البند");
    } else {
      blockers.push("Description heading EN input missing");
      exitCode = Math.max(exitCode, 2);
    }
    await page.waitForTimeout(500);
    await page.locator('.wsv2-wf-section[data-section="items"]').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.locator("section.wsv2-studio-canvas").screenshot({
      path: join(outDir, "after-products-heading-edited-preview.png"),
    });

    await page.screenshot({ path: join(outDir, "after-full-preview-no-overflow.png"), fullPage: true });

    const dl = [];
    page.on("download", (d) => dl.push(d));
    try {
      await page.getByRole("button", { name: /PDF/i }).first().click({ timeout: 12000 });
      await page.waitForTimeout(3500);
      if (dl[0]) {
        const pdfPath = join(outDir, "after-products-heading-edited-pdf.pdf");
        await dl[0].saveAs(pdfPath);
        if (!existsSync(pdfPath)) {
          blockers.push("PDF missing after save");
          exitCode = Math.max(exitCode, 2);
        } else {
          reportExtras.pdfPath = pdfPath;
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
  }

  return { exitCode, blockers, reportExtras };
}

/** @returns {Promise<{ exitCode: number, blockers: string[], reportExtras: object }>} */
async function runInfoCardColumnAuditFixSuite(page, outDir) {
  let exitCode = 0;
  const blockers = [];
  const reportExtras = {};

  try {
    await page.goto(STUDIO_URL, { waitUntil: "networkidle", timeout: 120000 });
    await page.locator(".wsv2-template-studio").waitFor({ timeout: 60000 });
    await page.evaluate((k) => localStorage.removeItem(k), UI_KEY);
    await page.reload({ waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(800);
    await page.locator(".wsv2-template-studio").waitFor({ timeout: 60000 });

    await page.getByRole("tab", { name: "EN + AR", exact: true }).click().catch(() => {});
    await page.waitForTimeout(350);

    await page.addStyleTag({
      content:
        "[data-wsv2] body.wsv2-cap-old-info-grid .wsv2-doc-paper-inner .wsv2-info-row-3col{grid-template-columns:125px 225px 125px !important;}",
    });
    await page.evaluate(() => document.body.classList.add("wsv2-cap-old-info-grid"));
    await page.waitForTimeout(300);
    await page.locator('.wsv2-wf-section[data-section="customer"]').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.locator("section.wsv2-studio-canvas").screenshot({
      path: join(outDir, "before-info-card-four-column-looking-layout.png"),
    });
    await page.evaluate(() => document.body.classList.remove("wsv2-cap-old-info-grid"));
    await page.reload({ waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(800);
    await page.locator(".wsv2-template-studio").waitFor({ timeout: 60000 });
    await page.getByRole("tab", { name: "EN + AR", exact: true }).click().catch(() => {});
    await page.waitForTimeout(350);

    await page.selectOption("#wsv2-section-selector", "customer").catch(() => {});
    await page.waitForTimeout(250);
    await page.locator("#wsv2-customer-en-col-width").fill("125");
    await page.locator("#wsv2-customer-value-col-width").fill("225");
    await page.locator("#wsv2-customer-ar-col-width").fill("125");
    await page.selectOption("#wsv2-customer-en-align", "left").catch(() => {});
    await page.selectOption("#wsv2-customer-value-align", "center").catch(() => {});
    await page.selectOption("#wsv2-customer-ar-align", "right").catch(() => {});
    await page.locator("label[for='wsv2-customer-en-col-width']").click();
    await page.waitForTimeout(500);

    const audit = await page.evaluate(() => {
      function inspect(sectionSel) {
        const sec = document.querySelector(sectionSel);
        if (!sec) return { missing: true };
        const row = sec.querySelector(".wsv2-info-row-3col");
        if (!row) return { missing: true, sectionSel };
        const cs = getComputedStyle(row);
        const kids = row.children;
        const childTags = Array.from(kids).map((n) => n.className);
        return {
          childCount: kids.length,
          childClasses: childTags,
          gridTemplateColumns: cs.gridTemplateColumns,
          columnGap: cs.columnGap,
          rowWidthPx: row.getBoundingClientRect().width,
        };
      }
      return {
        customer: inspect('.wsv2-wf-section[data-section="customer"]'),
        docInfo: inspect('.wsv2-wf-section[data-section="docInfo"]'),
      };
    });
    reportExtras.domAudit = audit;

    const domMd = [
      "# DOM / grid audit — Workspace V2 info cards",
      "",
      "## Summary table",
      "",
      "| Card | File | Component / class | Child cells per row | Grid tracks (computed) | Right-gap cause (pre-fix) |",
      "|---|---|---:|---|---|---|",
      "| Client | `WorkspaceV2DocumentRenderer.tsx` → `InfoTable` | `.wsv2-info-row-3col` + `.wsv2-info-cell-*` | **3** (en / value / ar) | See JSON below | Fixed `Npx Npx Npx` tracks narrower than row `width:100%` → empty area right of AR cell |",
      "| Document | (shared `InfoTable`) | same | **3** | same | same |",
      "",
      "## Live sample (first row, after fix)",
      "",
      "```json",
      JSON.stringify(audit, null, 2),
      "```",
      "",
      "- Expected: `childCount` === 3, `gridTemplateColumns` includes `minmax(` and `1fr` (value track grows).",
      "",
    ].join("\n");
    writeFileSync(join(outDir, "dom-column-count-report.md"), domMd);

    if (audit.customer?.childCount != null && audit.customer.childCount !== 3) {
      blockers.push(`Customer info row: expected 3 cells, got ${audit.customer.childCount}`);
      exitCode = Math.max(exitCode, 2);
    }
    if (audit.docInfo?.childCount != null && audit.docInfo.childCount !== 3) {
      blockers.push(`Document info row: expected 3 cells, got ${audit.docInfo.childCount}`);
      exitCode = Math.max(exitCode, 2);
    }
    const g1 = audit.customer?.gridTemplateColumns ?? "";
    const g2 = audit.docInfo?.gridTemplateColumns ?? "";
    if (g1 && (!g1.includes("minmax") || !g1.includes("1fr"))) {
      blockers.push(`Customer grid should use minmax(..,1fr) for value column; got: ${g1}`);
      exitCode = Math.max(exitCode, 2);
    }
    if (g2 && (!g2.includes("minmax") || !g2.includes("1fr"))) {
      blockers.push(`Document grid should use minmax(..,1fr) for value column; got: ${g2}`);
      exitCode = Math.max(exitCode, 2);
    }

    await page.locator('.wsv2-wf-section[data-section="customer"]').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.locator("section.wsv2-studio-canvas").screenshot({
      path: join(outDir, "after-client-info-exact-3-columns.png"),
    });
    await page.locator("section.wsv2-studio-canvas").screenshot({
      path: join(outDir, "after-arabic-right-align-near-border.png"),
    });
    await page.locator("section.wsv2-studio-canvas").screenshot({
      path: join(outDir, "after-column-width-125-225-125.png"),
    });

    await page.selectOption("#wsv2-section-selector", "docInfo").catch(() => {});
    await page.waitForTimeout(350);
    await page.locator("#wsv2-docinfo-en-col-width").fill("125");
    await page.locator("#wsv2-docinfo-value-col-width").fill("225");
    await page.locator("#wsv2-docinfo-ar-col-width").fill("125");
    await page.selectOption("#wsv2-docinfo-en-align", "left").catch(() => {});
    await page.selectOption("#wsv2-docinfo-value-align", "center").catch(() => {});
    await page.selectOption("#wsv2-docinfo-ar-align", "right").catch(() => {});
    await page.locator("label[for='wsv2-docinfo-en-col-width']").click();
    await page.waitForTimeout(450);
    await page.locator('.wsv2-wf-section[data-section="docInfo"]').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.locator("section.wsv2-studio-canvas").screenshot({
      path: join(outDir, "after-document-info-exact-3-columns.png"),
    });

    await page.screenshot({ path: join(outDir, "after-full-preview-no-overflow.png"), fullPage: true });
  } catch (e) {
    console.error(e);
    blockers.push(String(e?.message || e));
    exitCode = 1;
  }

  return { exitCode, blockers, reportExtras };
}

/** @returns {Promise<{ exitCode: number, blockers: string[], reportExtras: object }>} */
async function runStampPanelsSuite(page, outDir) {
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
  }

  return { exitCode, blockers, reportExtras };
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1680, height: 1050 } });

let exitCode = 0;
let blockers = [];
let reportExtras = {};

try {
  if (suite === "totals-amount-117") {
    const r = await runTotalsAmount117Suite(page, outDir);
    exitCode = r.exitCode;
    blockers = r.blockers;
    reportExtras = r.reportExtras;
  } else if (suite === "info-column-defaults-150-250-150") {
    const r = await runInfoColumnDefaults150250150Suite(page, outDir);
    exitCode = r.exitCode;
    blockers = r.blockers;
    reportExtras = r.reportExtras;
  } else if (suite === "info-row-density-fix") {
    const r = await runInfoRowDensityFixSuite(page, outDir);
    exitCode = r.exitCode;
    blockers = r.blockers;
    reportExtras = r.reportExtras;
  } else if (suite === "info-card-toggle-heading-editor") {
    const r = await runInfoCardToggleHeadingEditorSuite(page, outDir);
    exitCode = r.exitCode;
    blockers = r.blockers;
    reportExtras = r.reportExtras;
  } else if (suite === "info-card-column-audit-fix") {
    const r = await runInfoCardColumnAuditFixSuite(page, outDir);
    exitCode = r.exitCode;
    blockers = r.blockers;
    reportExtras = r.reportExtras;
  } else {
    const r = await runStampPanelsSuite(page, outDir);
    exitCode = r.exitCode;
    blockers = r.blockers;
    reportExtras = r.reportExtras;
  }
} finally {
  await browser.close();
}

const elapsed = Date.now() - t0;

if (suite === "totals-amount-117") {
  writeFileSync(
    join(outDir, "modified-files.txt"),
    ["lib/workspace-v2/template-ui-settings.ts", "tools/capture-template-studio-screens.mjs", ""].join("\n"),
  );
  writeFileSync(
    join(outDir, "validation-report.md"),
    [
      "# Validation — Workspace V2 Totals Amount column default (117)",
      "",
      `- URL: ${STUDIO_URL}`,
      `- localStorage key: \`${UI_KEY}\` — removed to verify clean default`,
      `- **DEFAULT_TOTALS_BLOCK.totals_amount_col_width_px** must be **117** (inspector \`#wsv2-totals-col-amount\`).`,
      `- **Reset studio defaults** restores Amount column to **117** after a user edit.`,
      `- **Preview:** see \`after-preview-totals-canvas.png\`.`,
      `- **PDF:** \`${reportExtras.pdfPath || join(outDir, "after-pdf-export-totals-117.pdf")}\``,
      "",
      "## Telemetry",
      "",
      "```json",
      JSON.stringify(reportExtras, null, 2),
      "```",
      "",
      `- Exit code: ${exitCode}`,
      `- Blockers: ${blockers.length ? "see blockers.md" : "none"}`,
      "",
    ].join("\n"),
  );
} else if (suite === "info-column-defaults-150-250-150") {
  writeFileSync(
    join(outDir, "modified-files.txt"),
    ["lib/workspace-v2/template-ui-settings.ts", "tools/capture-template-studio-screens.mjs", ""].join("\n"),
  );
  writeFileSync(
    join(outDir, "validation-report.md"),
    [
      "# Validation — Workspace V2 info cards column defaults (150 / 250 / 150)",
      "",
      `- URL: ${STUDIO_URL}`,
      `- localStorage key: \`${UI_KEY}\` — removed to verify clean default`,
      "- **DEFAULT_INFO_CARD_LAYOUT:** `englishColumnWidthPx` **150**, `valueColumnWidthPx` **250**, `arabicColumnWidthPx` **150** (shared Client + Document info).",
      "- **Reset studio defaults** restores all three after edits.",
      "- **Screens:** `before-info-column-defaults.png`, `after-info-column-defaults-150-250-150.png`, canvas previews for customer + docInfo.",
      "",
      "## Telemetry",
      "",
      "```json",
      JSON.stringify(reportExtras, null, 2),
      "```",
      "",
      `- Exit code: ${exitCode}`,
      `- Blockers: ${blockers.length ? "see blockers.md" : "none"}`,
      "",
    ].join("\n"),
  );
} else if (suite === "info-row-density-fix") {
  writeFileSync(
    join(outDir, "modified-files.txt"),
    [
      "lib/workspace-v2/template-ui-settings.ts",
      "lib/workspace-v2/document-template-renderer.ts",
      "components/workspace-v2/WorkspaceV2DocumentRenderer.tsx",
      "components/workspace-v2/WorkspaceV2TemplateStudio.tsx",
      "app/workspace-v2/v2.css",
      "lib/workspace-v2/exports/pdf.ts",
      "tools/capture-template-studio-screens.mjs",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(outDir, "validation-report.md"),
    [
      "# Validation — Workspace V2 info cards row density (compact spacing)",
      "",
      `- URL: ${STUDIO_URL}`,
      "- Inspector: Card padding / Row padding Y / Row gap set to **0**; card min height **0** (auto).",
      "- Preview: client + document info cards should show tight row spacing (no schema min-height shell or extra section padding).",
      "- Screens: \`before-info-row-large-gaps.png\` (defaults), \`after-row-gap-0-padding-0-compact.png\`, \`after-client-info-compact.png\`, \`after-document-info-compact.png\`.",
      "",
      "## Telemetry",
      "",
      "```json",
      JSON.stringify(reportExtras, null, 2),
      "```",
      "",
      `- Exit code: ${exitCode}`,
      `- Blockers: ${blockers.length ? "see blockers.md" : "none"}`,
      "",
    ].join("\n"),
  );
} else if (suite === "info-card-toggle-heading-editor") {
  writeFileSync(
    join(outDir, "modified-files.txt"),
    [
      "lib/workspace-v2/template-ui-settings.ts",
      "lib/workspace-v2/document-template-renderer.ts",
      "components/workspace-v2/WorkspaceV2DocumentRenderer.tsx",
      "components/workspace-v2/WorkspaceV2TemplateStudio.tsx",
      "lib/workspace-v2/exports/pdf.ts",
      "app/workspace-v2/v2.css",
      "tools/capture-template-studio-screens.mjs",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(outDir, "validation-report.md"),
    [
      "# Validation — Workspace V2 info card sizes, field switches, item headings",
      "",
      `- URL: ${STUDIO_URL}`,
      "- **Client / Document** inspector: card width, min height, fixed height, padding, row gap (stable ids `wsv2-client-*` / `wsv2-docinfo-*`).",
      "- **Field visibility:** compact `role=\"switch\"` toggles (Customer + Document info sections).",
      "- **Products / Services:** per-column EN/AR heading inputs; Description edited to **Item Description** / **وصف البند** in capture.",
      "",
      "## Screenshots",
      "",
      "- `before-large-info-card-spacing.png`",
      "- `before-awkward-toggle-buttons.png`",
      "- `before-fixed-table-headings.png`",
      "- `after-client-card-controls-visible.png`",
      "- `after-document-card-controls-visible.png`",
      "- `after-client-card-auto-height-compact.png`",
      "- `after-document-card-auto-height-compact.png`",
      "- `after-client-card-fixed-height-test.png`",
      "- `after-document-card-fixed-height-test.png`",
      "- `after-row-gap-0-padding-0-compact.png`",
      "- `after-customer-field-compact-toggles.png`",
      "- `after-document-field-compact-toggles.png`",
      "- `after-toggle-off-hides-field.png`",
      "- `after-toggle-on-shows-field.png`",
      "- `after-products-heading-editor-controls.png`",
      "- `after-products-heading-edited-preview.png`",
      "- `after-full-preview-no-overflow.png`",
      "",
      `- **PDF (if captured):** \`${reportExtras.pdfPath || join(outDir, "after-products-heading-edited-pdf.pdf")}\``,
      "",
      "## Telemetry",
      "",
      "```json",
      JSON.stringify(reportExtras, null, 2),
      "```",
      "",
      `- Exit code: ${exitCode}`,
      `- Blockers: ${blockers.length ? "see blockers.md" : "none"}`,
      "",
    ].join("\n"),
  );
} else if (suite === "info-card-column-audit-fix") {
  writeFileSync(
    join(outDir, "modified-files.txt"),
    [
      "components/workspace-v2/WorkspaceV2DocumentRenderer.tsx",
      "lib/workspace-v2/exports/pdf.ts",
      "app/workspace-v2/v2.css",
      "tools/capture-template-studio-screens.mjs",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(outDir, "validation-report.md"),
    [
      "# Validation — Workspace V2 info cards: exactly 3 grid columns",
      "",
      `- URL: ${STUDIO_URL}`,
      "- Rows: **3** DOM children per `.wsv2-info-row-3col` (English | Value | Arabic).",
      "- Grid: `minmax(valueMinPx, 1fr)` middle track fills card width — no slack “fourth” strip.",
      "- PDF: value column width recomputed to `tableW - enW - arW - 2*gap`.",
      "",
      "## Artifacts",
      "",
      "- `before-info-card-four-column-looking-layout.png` — injected fixed `125px 225px 125px` (pre-fix look).",
      "- `after-client-info-exact-3-columns.png`",
      "- `after-document-info-exact-3-columns.png`",
      "- `after-arabic-right-align-near-border.png`",
      "- `after-column-width-125-225-125.png`",
      "- `after-full-preview-no-overflow.png`",
      "- `dom-column-count-report.md`",
      "",
      "## Telemetry",
      "",
      "```json",
      JSON.stringify(reportExtras, null, 2),
      "```",
      "",
      `- Exit code: ${exitCode}`,
      `- Blockers: ${blockers.length ? "see blockers.md" : "none"}`,
      "",
    ].join("\n"),
  );
} else {
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
    join(outDir, "validation-report.md"),
    `# Validation — stamp/panels/title\n\n- URL: ${STUDIO_URL}\n- **localStorage key:** \\\`${UI_KEY}\\\` (\`studioLayout.leftPanelWidthPx\`, \`studioLayout.rightPanelWidthPx\`)\n- **Stamp defaults:** 150×90 stamp + 150×90 signature (inspector inputs).\n- **Title colors:** English/Arabic document title use typography colors (see canvas screenshots).\n- **Layout telemetry (JSON):**\n\n\`\`\`json\n${JSON.stringify(reportExtras, null, 2)}\n\`\`\`\n\n- **PDF:** \`${join(outDir, "after-pdf-export.pdf")}\`\n- Exit: ${exitCode}\n- Blockers: ${blockers.length ? "see blockers.md" : "none"}\n`,
  );
}

writeFileSync(
  join(outDir, "execution-time-report.md"),
  `# Execution time\n\n- Suite: ${suite}\n- Elapsed ms: ${elapsed}\n- Finished: ${new Date().toISOString()}\n`,
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
