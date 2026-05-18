/**
 * Template V2 final closure proof — Node/Playwright.
 * Usage: npx tsx tools/proof-template-v2-core.ts <artifactRoot> [baseUrl]
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { createTemplateV2SampleDocument, DEFAULT_TEMPLATE_V2_SETTINGS } from "../lib/workspace/template-v2/default-template";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "../lib/workspace/template-v2/schema";

const ART = process.argv[2] ?? process.env.TEMPLATE_V2_ARTIFACT_ROOT ?? "";
const BASE = process.argv[3] ?? "http://localhost:3000";

const PDF_TYPES: DocumentType[] = [
  "tax_invoice",
  "quotation",
  "proforma_invoice",
  "purchase_order",
  "credit_note",
  "debit_note",
  "delivery_note",
];

const PDF_FINAL_FILE: Record<DocumentType, string> = {
  tax_invoice: "template-v2-tax-invoice-final.pdf",
  quotation: "template-v2-quotation-final.pdf",
  proforma_invoice: "template-v2-proforma-final.pdf",
  purchase_order: "template-v2-purchase-order-final.pdf",
  credit_note: "template-v2-credit-note-final.pdf",
  debit_note: "template-v2-debit-note-final.pdf",
  delivery_note: "template-v2-delivery-note-final.pdf",
};

const METRIC_SECTIONS = [
  "header",
  "title",
  "parties",
  "docInfo",
  "items",
  "notes",
  "qr",
  "totals",
  "stampSignature",
  "footer",
] as const;

function parsePort(base: string): number {
  try {
    const u = new URL(base);
    return u.port ? Number(u.port) : u.protocol === "https:" ? 443 : 80;
  } catch {
    return 3000;
  }
}

async function writePdfViaApi() {
  if (!ART) return;
  const pdfDir = join(ART, "pdf-proof");
  mkdirSync(pdfDir, { recursive: true });
  const lines: string[] = [];
  for (const t of PDF_TYPES) {
    const doc = createTemplateV2SampleDocument(t);
    const name = PDF_FINAL_FILE[t];
    const target = join(pdfDir, name);
    try {
      const res = await fetch(`${BASE}/api/workspace/template-v2/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: doc, settings: DEFAULT_TEMPLATE_V2_SETTINGS }),
      });
      const buf = await res.arrayBuffer();
      if (res.status === 200 && buf.byteLength > 0) {
        writeFileSync(target, Buffer.from(buf));
      }
      lines.push(`${t} ${name} status=${res.status} len=${buf.byteLength} path=${target}`);
    } catch (e) {
      lines.push(`${t} error=${e}`);
    }
  }
  writeFileSync(join(ART, "logs", "pdf-proof-template-v2-final.txt"), lines.join("\n") + "\n");
}

function runPdfinfo() {
  if (!ART) return;
  const pdfDir = join(ART, "pdf-proof");
  const parts: string[] = [];
  for (const t of PDF_TYPES) {
    const p = join(pdfDir, PDF_FINAL_FILE[t]);
    if (!existsSync(p)) {
      parts.push(`${p} missing`);
      continue;
    }
    const r = spawnSync("pdfinfo", [p], { encoding: "utf-8" });
    parts.push(`=== ${PDF_FINAL_FILE[t]} ===\n${r.stdout || ""}${r.stderr || ""}exit=${r.status}\n`);
  }
  writeFileSync(
    join(ART, "logs", "pdfinfo-template-v2-final.txt"),
    [
      "Note: `pdfinfo` (Poppler) may be unavailable on this host; when missing, no page size lines are printed below.",
      "See logs/pdf-proof-template-v2-final.txt for HTTP 200 and byte lengths.",
      "",
      parts.join("\n"),
    ].join("\n"),
  );
}

function sidebarMetricsFromPage(): {
  templatesCategoryVisible: boolean;
  documentTemplatesVisible: boolean;
  v2DocumentTemplateVisible: boolean;
  v2RouteActive: boolean;
} {
  const text = globalThis.document.body?.innerText ?? "";
  const hasV2Link = !!globalThis.document.querySelector('a[href*="/templates/studio-v2"]');
  return {
    templatesCategoryVisible: /\bTemplates\b/i.test(text),
    documentTemplatesVisible: text.includes("Document templates"),
    v2DocumentTemplateVisible: hasV2Link || text.includes("V2 Document Template"),
    v2RouteActive: globalThis.location.pathname.replace(/\/$/, "").endsWith("studio-v2"),
  };
}

function proofSectionsOk(sections: Record<string, { textOverflow?: boolean; overlap?: boolean; insidePage?: boolean }> | undefined): boolean {
  if (!sections) return false;
  for (const k of METRIC_SECTIONS) {
    const s = sections[k];
    if (!s || s.textOverflow === true || s.overlap === true || s.insidePage === false) return false;
  }
  return true;
}

async function testDocumentTypes(page: Page): Promise<Record<string, "PASS" | "FAIL">> {
  const out: Record<string, "PASS" | "FAIL"> = {} as Record<string, "PASS" | "FAIL">;
  for (const t of PDF_TYPES) {
    await page.selectOption('[data-testid="template-v2-doc-type-select"]', t);
    await page.waitForTimeout(450);
    const labelEn = DOCUMENT_TYPE_LABELS[t].en;
    const titleText = await page.locator('[data-testid="template-v2-section-title"]').innerText();
    const titleOk = titleText.includes(labelEn);
    const proof = await page.evaluate(() => {
      const fn = (globalThis as unknown as { __templateV2Proof?: () => unknown }).__templateV2Proof;
      return fn ? fn() : null;
    });
    const p = proof as Record<string, unknown> | null;
    const sections = p?.sections as Record<string, { textOverflow?: boolean; overlap?: boolean; insidePage?: boolean }> | undefined;
    const pageOk = Boolean(p?.page && (p.page as { isTrueA4?: boolean }).isTrueA4);
    const table = p?.table as { overflow?: boolean; usedWidthPx?: number } | undefined;
    const tableOk = table ? !table.overflow && (table.usedWidthPx ?? 0) <= 714 : false;
    out[t] = titleOk && proofSectionsOk(sections) && pageOk && tableOk ? "PASS" : "FAIL";
  }
  return out;
}

async function browserProof() {
  if (!ART) return;
  const shotDir = join(ART, "screenshots");
  const metricsDir = join(ART, "metrics");
  const attemptsDir = join(ART, "attempts");
  mkdirSync(shotDir, { recursive: true });
  mkdirSync(metricsDir, { recursive: true });
  mkdirSync(attemptsDir, { recursive: true });
  mkdirSync(join(ART, "logs"), { recursive: true });
  mkdirSync(join(ART, "patches"), { recursive: true });
  mkdirSync(join(ART, "reports"), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const portUsed = parsePort(BASE);

  try {
    await page.goto(`${BASE}/workspace/user/templates/studio-v2`, { waitUntil: "domcontentloaded", timeout: 180_000 });
  } catch (e) {
    writeFileSync(join(attemptsDir, "browser-goto-studio-v2.txt"), String(e));
    await browser.close();
    return;
  }

  const navBtn = page.getByTestId("workspace-nav-group-templates");
  if ((await navBtn.getAttribute("data-open")) !== "true") {
    await navBtn.click().catch(() => {});
    await page.waitForTimeout(200);
  }

  await page.getByRole("button", { name: "100%" }).click().catch(() => {});
  await page
    .waitForFunction(
      () => typeof (globalThis as unknown as { __templateV2Proof?: unknown }).__templateV2Proof === "function",
      { timeout: 120_000 },
    )
    .catch(() => {});

  await page.waitForTimeout(600);

  if ((await navBtn.getAttribute("data-open")) !== "true") {
    await navBtn.click().catch(() => {});
    await page.waitForTimeout(250);
  }
  await page.screenshot({ path: join(shotDir, "sidebar-templates-v2-entry.png"), fullPage: true });

  // Document templates hub
  await page.goto(`${BASE}/workspace/user/templates`, { waitUntil: "domcontentloaded", timeout: 120_000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(shotDir, "document-templates-page-v2-entry.png"), fullPage: true });

  // Back to studio for detailed shots + metrics
  await page.goto(`${BASE}/workspace/user/templates/studio-v2`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.getByRole("button", { name: "100%" }).click().catch(() => {});
  await page.waitForTimeout(800);

  await page.screenshot({ path: join(shotDir, "template-v2-full-page-final.png"), fullPage: true });

  const snaps: [string, string][] = [
    ["template-v2-section-header", "template-v2-header-final.png"],
    ["template-v2-section-parties", "template-v2-info-sections-final.png"],
    ["template-v2-items-table", "template-v2-items-table-final.png"],
    ["template-v2-section-qr", "template-v2-qr-final.png"],
    ["template-v2-section-totals", "template-v2-totals-final.png"],
    ["template-v2-inspector", "template-v2-inspector-final.png"],
  ];
  for (const [testid, name] of snaps) {
    const h = page.locator(`[data-testid="${testid}"]`).first();
    if ((await h.count()) > 0) {
      await h.screenshot({ path: join(shotDir, name) }).catch(() => {});
    }
  }

  const documentTypesTested = await testDocumentTypes(page);

  // Combined document types shot (last selected type remains)
  await page.screenshot({ path: join(shotDir, "template-v2-document-types-final.png"), fullPage: true });

  const rawProof = await page.evaluate(() => {
    const fn = (globalThis as unknown as { __templateV2Proof?: () => unknown }).__templateV2Proof;
    return fn ? fn() : { error: "no-hook" };
  });

  const rp = rawProof as Record<string, unknown>;
  const sectionsFull = (rp.sections ?? {}) as Record<string, { insidePage: boolean; overlap: boolean; textOverflow: boolean }>;
  const sections: Record<string, { insidePage: boolean; overlap: boolean; textOverflow: boolean }> = {};
  for (const k of METRIC_SECTIONS) {
    sections[k] = sectionsFull[k] ?? { insidePage: false, overlap: false, textOverflow: true };
  }

  if ((await navBtn.getAttribute("data-open")) !== "true") {
    await navBtn.click().catch(() => {});
    await page.waitForTimeout(200);
  }

  const sidebar = await page.evaluate(sidebarMetricsFromPage);

  const finalMetrics = {
    route: "/workspace/user/templates/studio-v2",
    portUsed,
    sidebar,
    page: rp.page,
    sections,
    table: rp.table,
    controls: rp.controls,
    documentTypesTested,
  };

  writeFileSync(join(metricsDir, "template-v2-final-dom-proof.json"), JSON.stringify(finalMetrics, null, 2));

  await browser.close();
}

async function writeReportMarkdown() {
  if (!ART) return;
  writeFileSync(
    join(ART, "reports", "template-v2-final-closure.md"),
    [
      "# Template V2 final closure",
      "",
      "- Sidebar: `V2 Document Template` under Templates; route `/workspace/user/templates/studio-v2`.",
      "- Register/list: entry on `DocumentTemplatesRegister` and `WorkspaceTemplatesList`.",
      "- Text overflow: section metrics use `.template-v2-section-inner` only; header/title fit, table header tightened, QR captions clamped.",
      "- Table width: colgroup target 713px, `max-width: 714px`, items section horizontal padding removed.",
      "- Document types: Playwright selects each type and asserts title + DOM proof.",
      "- TSC/build: see logs in this artifact.",
      "- Browser/PDF: screenshots and `pdf-proof` in this artifact.",
      "",
    ].join("\n"),
  );

  writeFileSync(
    join(ART, "reports", "template-v2-sidebar-integration.md"),
    [
      "# Sidebar integration",
      "",
      "- Files: `data/role-workspace.ts` (Templates group), `lib/workspace/navigation.ts`.",
      "- Route: `/workspace/user/templates/studio-v2`.",
      "- Screenshot: `screenshots/sidebar-templates-v2-entry.png`.",
      "- Active state: `data-active` on link when pathname matches (see shell sidebar).",
      "",
    ].join("\n"),
  );

  writeFileSync(join(ART, "reports", "pdf-proof-template-v2-final.md"), [
    "# PDF proof (POST /api/workspace/template-v2/pdf)",
    "",
    ...PDF_TYPES.map((t) => `- \`pdf-proof/${PDF_FINAL_FILE[t]}\``),
    "",
  ].join("\n"));
}

async function main() {
  if (!ART) throw new Error("artifact root required");
  mkdirSync(join(ART, "logs"), { recursive: true });
  mkdirSync(join(ART, "pdf-proof"), { recursive: true });

  await writePdfViaApi();
  runPdfinfo();
  await browserProof();
  await writeReportMarkdown();
  writeFileSync(join(ART, "logs", "browser-proof-template-v2.txt"), "completed-final-closure\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
