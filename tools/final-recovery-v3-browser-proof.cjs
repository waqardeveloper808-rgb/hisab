#!/usr/bin/env node
/**
 * HISABIX Final Recovery V3 — workspace VAT registers, Template Studio styles,
 * templates register actions, preview intelligence route, baseline console/network checks.
 */

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE = (
  process.env.FINAL_RECOVERY_BASE ||
  process.env.BASE_URL ||
  "http://127.0.0.1:3000"
).replace(/\/$/, "");

const OUT = process.env.FINAL_RECOVERY_OUT;
if (!OUT || !fs.existsSync(OUT)) {
  console.error(
    "FINAL_RECOVERY_OUT must point to an existing artifact root directory.",
  );
  process.exit(2);
}

const SHOTS = path.join(OUT, "screenshots");
const REPORT_JSON = path.join(OUT, "reports", "browser-validation-v3b.json");
const METRICS_JSON = path.join(OUT, "reports", "template-style-difference-metrics.json");

function ensureDirs() {
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(METRICS_JSON), { recursive: true });
}

async function sampleTemplateStyleDom(page, styleLabel) {
  return page.evaluate((label) => {
    const inner = document.querySelector(".wsv2-doc-paper-inner[data-style]");
    const dataStyle = inner?.getAttribute("data-style") ?? null;
    const fontPx = inner ? Number.parseFloat(getComputedStyle(inner).fontSize || "NaN") : NaN;
    let sectionGapApprox = null;
    let cardRadiusPx = null;
    let tableRowPaddingTop = null;
    const sections = inner
      ? [...inner.querySelectorAll(".wsv2-wf-section[data-section]")].filter((el) => {
          const ds = el.getAttribute("data-section") || "";
          return ds !== "header" && ds !== "footer";
        })
      : [];
    if (sections.length >= 2) {
      const a = sections[0].getBoundingClientRect();
      const b = sections[1].getBoundingClientRect();
      sectionGapApprox = Math.round(b.top - a.bottom);
    }
    if (sections[0]) {
      cardRadiusPx = Number.parseFloat(getComputedStyle(sections[0]).borderRadius || "NaN");
    }
    const cell = inner?.querySelector(".wsv2-wf-items-table tbody tr td");
    if (cell) {
      tableRowPaddingTop = Number.parseFloat(getComputedStyle(cell).paddingTop || "NaN");
    }
    const itemRowsVisible = inner
      ? inner.querySelectorAll(".wsv2-wf-items-table tbody tr").length
      : 0;
    const boxShadow =
      sections[0] ? getComputedStyle(sections[0]).boxShadow : inner ? getComputedStyle(inner).boxShadow : "";
    let greenAccentRgb = null;
    const modernProbe = inner?.querySelector(
      '[data-section="items"] .wsv2-wf-section-heading, [data-section="items"] span',
    );
    if (modernProbe) {
      const c = getComputedStyle(modernProbe).color || "";
      if (/rgb\(/.test(c)) greenAccentRgb = c.trim();
    }
    return {
      label,
      dataStyleAttr: dataStyle,
      domFontPx: Number.isFinite(fontPx) ? fontPx : null,
      sectionGapApproxPx: sectionGapApprox,
      sectionCardRadiusPx: Number.isFinite(cardRadiusPx) ? cardRadiusPx : null,
      tableBodyCellPaddingTopPx: Number.isFinite(tableRowPaddingTop) ? tableRowPaddingTop : null,
      denseItemRowsVisible: itemRowsVisible,
      sectionHasSoftShadow: Boolean(boxShadow && boxShadow !== "none"),
      modernGreenAccentColorSample: greenAccentRgb,
    };
  }, styleLabel);
}

async function main() {
  ensureDirs();
  const failures = [];
  const consoleErrors = [];
  const networkProblems = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1480, height: 900 } });
  const page = await context.newPage();

  page.on("console", (msg) => {
    const t = String(msg.text());
    if (msg.type() === "error") consoleErrors.push(t);
    if (/hydration failed|missing _next\/static/i.test(t)) {
      failures.push(`console_critical: ${t}`);
    }
  });

  page.on("response", async (res) => {
    const u = res.url();
    try {
      const st = res.status();
      if (st >= 400 && u.includes("/_next/static")) {
        networkProblems.push({ url: u, status: st });
      }
      if ([403, 404, 500].includes(st) && u.includes("/api/workspace/")) {
        /** intelligence preview probe handled separately below */
        if (!u.includes("/api/workspace/intelligence/reports")) {
          networkProblems.push({ url: u, status: st });
        }
      }
    } catch {
      /* ignore */
    }
  });

  try {
    const intel = await context.request.get(
      `${BASE}/api/workspace/intelligence/reports?mode=preview`,
      { headers: { "X-Workspace-Mode": "preview", Accept: "application/json" } },
    );
    if (intel.status() !== 200) {
      failures.push(`intelligence_preview_status:${intel.status()}`);
    }
  } catch (e) {
    failures.push(`intelligence_preview_fetch:${String(e?.message ?? e)}`);
  }

  const screenshot = async (rel, urlPath) => {
    const resp = await page.goto(`${BASE}${urlPath}`, {
      waitUntil: "domcontentloaded",
      timeout: 180_000,
    });
    const st = resp?.status() ?? 0;
    if (st >= 400) failures.push(`goto_${rel}_status:${st}`);
    await page.waitForTimeout(1200);
    await page
      .screenshot({
        path: path.join(SHOTS, `${rel}.png`),
        fullPage: true,
      })
      .catch(() => failures.push(`screenshot_missing:${rel}`));
  };

  await screenshot("workspace-user-vat", "/workspace/user/vat");
  if ((await page.locator('[data-testid="vat-received-open-register"]').count()) === 1) {
    await page.locator('[data-testid="vat-received-open-register"]').click();
    await page.waitForTimeout(800);
    if (!String(page.url()).includes("/workspace/user/vat/received")) {
      failures.push("vat_received_nav_not_register");
    }
  } else failures.push("vat_received_link_missing");

  await screenshot("vat-received-register", "/workspace/user/vat/received");
  await screenshot("vat-paid-register", "/workspace/user/vat/paid");
  await screenshot("document-templates-register", "/workspace/user/templates");

  /** Template Studio styles */
  await page.goto(`${BASE}/workspace/user/templates/studio?template=1`, {
    waitUntil: "domcontentloaded",
    timeout: 180_000,
  });
  await page.waitForTimeout(1500);

  const styleSel = page.locator('[data-testid="template-style-select"]');
  if ((await styleSel.count()) < 1) {
    failures.push("template_style_select_missing");
  } else {
    /** @type {Record<string, unknown>} */
    const styleMetricsByLabel = {};
    for (const v of ["standard", "modern", "compact"]) {
      await styleSel.selectOption(v).catch(() => {});
      await page.waitForTimeout(900);
      styleMetricsByLabel[v] = await sampleTemplateStyleDom(page, v);
      await page
        .screenshot({
          path: path.join(SHOTS, `template-style-${v}.png`),
          fullPage: true,
        })
        .catch(() => failures.push(`screenshot_missing:template-style-${v}`));
    }

    fs.writeFileSync(
      METRICS_JSON,
      JSON.stringify(
        {
          base: BASE,
          capturedAt: new Date().toISOString(),
          byStyle: styleMetricsByLabel,
        },
        null,
        2,
      ),
      "utf8",
    );
    const standard = styleMetricsByLabel.standard || {};
    const modern = styleMetricsByLabel.modern || {};
    const compact = styleMetricsByLabel.compact || {};

    /** @type {Record<string, unknown>} */
    const s = /** @type {Record<string, unknown>} */ (standard);
    const m = /** @type {Record<string, unknown>} */ (modern);
    const cp = /** @type {Record<string, unknown>} */ (compact);

    if (typeof s.sectionGapApproxPx === "number" && typeof m.sectionGapApproxPx === "number") {
      if (m.sectionGapApproxPx + 1e-6 < s.sectionGapApproxPx + 6) {
        failures.push(`style_gap_delta_weak:standard=${String(s.sectionGapApproxPx)}:modern=${String(m.sectionGapApproxPx)}`);
      }
    }
    if (typeof m.sectionCardRadiusPx === "number") {
      if (m.sectionCardRadiusPx + 1e-6 < 14) failures.push(`modern_radius_below_threshold:${String(m.sectionCardRadiusPx)}`);
    }
    if (m.sectionHasSoftShadow !== true) failures.push("modern_section_shadow_missing");
    if (
      typeof s.domFontPx === "number"
      && typeof cp.domFontPx === "number"
      && !(cp.domFontPx + 1e-6 < s.domFontPx)
    ) {
      failures.push(`compact_font_not_below_standard:${String(cp.domFontPx)}_vs_${String(s.domFontPx)}`);
    }
    if (
      typeof s.tableBodyCellPaddingTopPx === "number"
      && typeof cp.tableBodyCellPaddingTopPx === "number"
      && !(cp.tableBodyCellPaddingTopPx + 1e-6 < s.tableBodyCellPaddingTopPx)
    ) {
      failures.push(
        `compact_row_padding_not_smaller_than_standard:${String(cp.tableBodyCellPaddingTopPx)}_${String(s.tableBodyCellPaddingTopPx)}`,
      );
    }
    if (
      typeof s.sectionGapApproxPx === "number"
      && typeof cp.sectionGapApproxPx === "number"
      && !(cp.sectionGapApproxPx + 1e-6 < s.sectionGapApproxPx)
    ) {
      failures.push(
        `compact_section_gap_not_smaller_than_standard:${String(cp.sectionGapApproxPx)}_${String(s.sectionGapApproxPx)}`,
      );
    }
  }

  await page.goto(`${BASE}/workspace/user/templates/studio?template=1`, {
    waitUntil: "domcontentloaded",
    timeout: 180_000,
  });
  await page.waitForTimeout(1400);

  const requiredInspectorGroups = [
    "inspector-group-document",
    "inspector-group-selected-section",
    "inspector-group-layout",
    "inspector-group-typography-colors",
    "inspector-group-table-columns",
    "inspector-group-qr-totals",
    "inspector-group-company-assets",
    "inspector-group-preflight",
  ];
  for (const tid of requiredInspectorGroups) {
    const ccount = await page.locator(`[data-testid="${tid}"]`).count();
    if (ccount !== 1) failures.push(`inspector_${tid}:${ccount}`);
  }
  const rootGroups = await page.locator('[data-testid="template-studio-inspector-groups"]').count();
  if (rootGroups !== 1) failures.push(`template_studio_inspector_root:${rootGroups}`);

  await screenshot("workspace-user-invoices", "/workspace/user/invoices");
  await screenshot("reports-cash-flow", "/workspace/user/reports/cash-flow");
  await screenshot("user-reconciliation", "/workspace/user/reconciliation");

  if ((await page.locator('[aria-label="Open WhatsApp support"]').count()) > 0) {
    failures.push("floating_whatsapp_visible");
  }
  const aiBtns = await page.locator('button[aria-label="Chat"]').count();
  if (aiBtns > 0) failures.push("floating_ai_visible");

  const filteredNetwork = networkProblems.filter(
    (n) =>
      !(String(n.url).includes("intelligence/reports") && n.status === 403),
  );

  const report = {
    base: BASE,
    timestamp: new Date().toISOString(),
    failures,
    consoleErrorsSample: consoleErrors.slice(0, 40),
    networkProblems: filteredNetwork.slice(0, 40),
    screenshotsDir: SHOTS,
  };

  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({ ok: failures.length === 0, REPORT_JSON }));

  await browser.close();
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(9);
});

