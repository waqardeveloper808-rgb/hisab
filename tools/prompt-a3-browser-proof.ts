/**
 * Prompt A3 — Playwright screenshots for Template Studio + overflow checks.
 *
 * Usage: ARTIFACT_ROOT=... BASE_URL=http://127.0.0.1:3000 npx tsx tools/prompt-a3-browser-proof.ts
 */
import { chromium } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";

const ARTIFACT_ROOT =
  process.env.ARTIFACT_ROOT ??
  path.join(process.cwd(), "artifact", "prompt-a3-template-studio-rebuild-20260501-041001");
const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const ROUTE =
  "/workspace/user/templates/studio?template=tmpl-standard&style=standard&message=PromptA3BrowserProof";

const shotDir = path.join(ARTIFACT_ROOT, "screenshots");

async function main(): Promise<void> {
  fs.mkdirSync(shotDir, { recursive: true });

  const consoleLines: string[] = [];
  const pageErrors: string[] = [];
  const netFails: string[] = [];

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 920 },
    deviceScaleFactor: 1,
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleLines.push(`[console.${msg.type()}] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => {
    pageErrors.push(String(err));
  });
  page.on("requestfailed", (req) => {
    netFails.push(`${req.url()} — ${req.failure()?.errorText ?? "failed"}`);
  });

  await page.goto(new URL(ROUTE, BASE_URL).toString(), {
    waitUntil: "networkidle",
    timeout: 180000,
  });

  await page.waitForSelector('[data-testid="template-studio-toolbar"]', { timeout: 60000 });

  const ids = await page.evaluate(() => ({
    toolbar: !!document.querySelector('[data-testid="template-studio-toolbar"]'),
    advancedToggle: !!document.querySelector('[data-testid="template-studio-advanced-toggle"]'),
    basic: !!document.querySelector('[data-testid="template-studio-basic-panel"]'),
    canvas: !!document.querySelector('[data-testid="template-studio-canvas"]'),
    advancedPresent: !!document.querySelector('[data-testid="template-studio-advanced-panel"]'),
    studioPage: !!document.querySelector('[data-testid="template-studio-page"]'),
    canvasSections: !!document.querySelector('[data-testid="inspector-group-canvas-sections"]'),
    hisabStudioPage: !!document.querySelector(".hisab-template-studio-page"),
  }));

  /** Inject very long bilingual text into first line item columns for overflow stress. */
  await page.evaluate(() => {
    const LONG_EN =
      "INDUSTRIAL-SUPPLY PRODUCT NAME ".repeat(12) +
      " SKU-XXXXXXXXXXXX-999 VAT-Eligible Service Description Segment";
    const LONG_AR =
      "\u0633\u0644\u0639\u0629-\u0635\u0646\u0627\u0639\u064a\u0629-\u0637\u0648\u064a\u0644\u0629 " + LONG_EN;

    document.querySelectorAll(".wsv2-wf-footer-text").forEach((el) => {
      el.innerHTML =
        `<span dir="ltr" style="font-size:11px;display:block">${LONG_EN.slice(0, 180)}\u2026</span>` +
        `<span class="wsv2-wf-type-ar" dir="rtl" lang="ar" style="font-size:11px;display:block;margin-top:4px">${LONG_AR.slice(0, 120)}\u2026</span>`;
    });

    const row = document.querySelector(".wsv2-wf-items-table tbody tr");
    const tds = row?.querySelectorAll("td") ?? [];
    if (tds.length >= 2) {
      (tds[1] as HTMLElement).textContent = LONG_EN;
    }
    if (tds.length >= 8) {
      (tds[7] as HTMLElement).textContent = LONG_AR;
    }

    const vatSpans = Array.from(document.querySelectorAll(".wsv2-header-card-en .wsv2-wf-line span[dir=ltr]"));
    if (vatSpans[0]) {
      vatSpans[0].textContent = "300-" + "9".repeat(28);
    }
  });

  /** Default state: Advanced should be CLOSED → advanced panel detached from DOM. */
  await page.locator('[data-testid="template-studio-canvas"]').scrollIntoViewIfNeeded();
  fs.writeFileSync(
    path.join(shotDir, "template-studio-advanced-off.png"),
    await page.screenshot({ fullPage: true, type: "png" }),
  );

  const advancedOffCount = await page.locator('[data-testid="template-studio-advanced-panel"]').count();

  await page.locator('[data-testid="template-studio-advanced-toggle"]').click();

  await page.locator('[data-testid="template-studio-advanced-panel"]').waitFor({ state: "visible", timeout: 30000 });

  const inspectorDetailsTestIds = await page.$$eval(
    '[data-testid="template-studio-inspector-groups"] > details',
    (nodes) =>
      nodes.map((n: Element) => ({
        tag: "details",
        dataTestId: n.getAttribute("data-testid") ?? "",
      })),
  );

  fs.writeFileSync(
    path.join(shotDir, "template-studio-advanced-on.png"),
    await page.screenshot({ fullPage: true, type: "png" }),
  );

  const canvas = page.locator('[data-testid="template-studio-canvas"]');
  const paper = canvas.locator(".paper");
  const overflow = await paper.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  }));

  /** Column resize knobs are positioned outside the table gutter and inflate scrollWidth; hide for parity checks. */
  await page.$$eval(".wsv2-wf-col-resize-handle", (els) =>
    els.forEach((el) => {
      const h = el as HTMLElement;
      h.style.display = "none";
    }),
  );

  /** Unscale `.paper` momentarily; measure document inner without Studio zoom transform skew. */
  const layoutMetrics = await paper.evaluate((paperEl) => {
    const prev = paperEl.style.transform;
    paperEl.style.transform = "none";
    const inner = paperEl.querySelector(".wsv2-doc-paper-inner") as HTMLElement | null;
    if (!inner) {
      paperEl.style.transform = prev;
      return { innerFound: false as const };
    }
    const sw = inner.scrollWidth;
    const cw = inner.clientWidth;
    const rr = inner.getBoundingClientRect();
    let maxRight = rr.right;
    const queue: Element[] = Array.from(inner.children);
    while (queue.length > 0) {
      const n = queue.shift()!;
      queue.push(...Array.from(n.children));
      const he = n as HTMLElement;
      const st = window.getComputedStyle(he);
      if (st.display === "none" || st.visibility === "hidden") continue;
      const cr = he.getBoundingClientRect();
      if (cr.width > 0 && cr.height > 0) maxRight = Math.max(maxRight, cr.right);
    }
    let worst: { scrollWidth: number; clientWidth: number; tag: string; cls: string } | null = null;
    inner.querySelectorAll("*").forEach((n) => {
      const he = n as HTMLElement;
      if (he.scrollWidth > he.clientWidth + 4) {
        if (!worst || he.scrollWidth > worst.scrollWidth) {
          worst = {
            scrollWidth: Math.round(he.scrollWidth),
            clientWidth: Math.round(he.clientWidth),
            tag: he.tagName,
            cls: (he.className && String(he.className).slice(0, 120)) || "",
          };
        }
      }
    });

    paperEl.style.transform = prev;
    return {
      innerFound: true as const,
      unscaledInnerScrollWidth: sw,
      unscaledInnerClientWidth: cw,
      bboxOverflowPxVsRoot: Math.max(0, Math.round((maxRight - rr.right) * 100) / 100),
      worstOverflowChild: worst,
    };
  });



  fs.writeFileSync(
    path.join(shotDir, "template-studio-canvas-overflow-proof.png"),
    await canvas.screenshot({ type: "png" }),
  );
  fs.writeFileSync(
    path.join(shotDir, "document-renderer-items-table-proof.png"),
    await page.locator(".wsv2-wf-items-table").first().screenshot({ type: "png" }),
  );

  await browser.close();

  const outcome = path.join(ARTIFACT_ROOT, "reports", "browser-proof-20260501.partial.json");
  fs.mkdirSync(path.dirname(outcome), { recursive: true });
  fs.writeFileSync(
    outcome,
    JSON.stringify(
      {
        route: ROUTE,
        baseURL: BASE_URL,
        viewport: { width: 1440, height: 920 },
        idsDetected: ids,
        advancedOffAdvancedPanelDetachedCountExpect0: advancedOffCount,
        inspectorDetailsOrderTopDown: inspectorDetailsTestIds,
        paperLayoutBox: overflow,
        docLayoutMetricsUnscaled: layoutMetrics,
        horizontalOverflowDocumentLayout:
          layoutMetrics.innerFound &&
          layoutMetrics.unscaledInnerScrollWidth > layoutMetrics.unscaledInnerClientWidth + 2,
        horizontalOverflowBBoxUnscaledPx:
          layoutMetrics.innerFound ? layoutMetrics.bboxOverflowPxVsRoot : null,
        consoleErrors: consoleLines,
        pageErrors,
        netFails,
      },
      null,
      2,
    ),
    "utf8",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
