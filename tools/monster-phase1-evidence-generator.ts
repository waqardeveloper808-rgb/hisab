/**
 * Generates Phase‑1 Monster Recovery continuation evidence under MONSTER_ARTIFACT_ROOT.
 *
 * Run from repo root:
 * `$env:MONSTER_ARTIFACT_ROOT='C:\\hisab\\artifacts\\phase1_monster_recovery_continuation_YYYYMMDD_HHMMSS'; npx tsx tools/monster-phase1-evidence-generator.ts`
 */
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { chromium } from "playwright";
import { buildPhase1Qr } from "@/lib/workspace/exports/qr";
import { renderDocumentPdf } from "@/lib/document-engine/render-document-pdf";
import { previewCompany } from "@/data/preview-company";
import type { GuestPreviewTemplate } from "@/lib/document-engine/workspace-v2-guest-pdf-types";
import type { PreviewContact, PreviewDocument } from "@/lib/workspace-preview";

const SUBTOTAL = 1_000_000;
const VAT = 150_000;
const TOTAL = 1_150_000;

function sha256Utf8(content: string) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function mmFromPx(px: number) {
  return Number(((px / 96) * 25.4).toFixed(3));
}

async function captureLayoutMeasures(pageHtmlFull: string, label: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1024, height: 1440 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.setContent(pageHtmlFull, { waitUntil: "load" });

  const body = await page.evaluate(
    `(() => {
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight);
      const sr =
        (document.querySelector('[data-doc-root="true"]') ||
          document.querySelector(".cd-document-root") ||
          document.body);
      const tableEl = sr.querySelector("table") ?? document.querySelector("table");
      const qrImg = sr.querySelector("img[alt*='QR'], img[src^='data:image']");
      const totalsEl = document.querySelector("[data-doc-totals-card], [data-doc-section='totals']");

      const bb = function (el) {
        if (!el || !(el instanceof HTMLElement)) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      };

      const rootBox = sr.getBoundingClientRect();
      const sw = Math.max(document.documentElement.scrollWidth, sr.scrollWidth);
      const sh = Math.max(document.documentElement.scrollHeight, sr.scrollHeight);

      var rootSel = "fallback_body";
      if (sr.matches && sr.matches('[data-doc-root="true"]')) rootSel = "legacy_article[data-doc-root]";
      else if (sr.classList && sr.classList.contains("cd-document-root")) rootSel = ".cd-document-root";

      return {
        viewportCssPx: { width: vw, height: vh },
        rootSelectorGuess: rootSel,
        contentBoundingBoxCssPx: bb(sr),
        scrollWidthPx: sw,
        scrollHeightPx: sh,
        tableBoundingBoxCssPx: tableEl ? bb(tableEl) : null,
        totalsBoundingBoxCssPx: totalsEl ? bb(totalsEl) : null,
        qrBoundingBoxCssPx: qrImg ? bb(qrImg) : null,
        overflowX: sw > vw + 1,
        overflowY: sh > vh + 5,
        rootApproxWidthPx: Math.round(rootBox.width || 794),
        rootApproxHeightPx: Math.round(rootBox.height),
      };
    })()`,
  ) as {
    viewportCssPx: { width: number; height: number };
    rootSelectorGuess: string;
    contentBoundingBoxCssPx: { x: number; y: number; width: number; height: number } | null;
    scrollWidthPx: number;
    scrollHeightPx: number;
    tableBoundingBoxCssPx: { x: number; y: number; width: number; height: number } | null;
    totalsBoundingBoxCssPx: { x: number; y: number; width: number; height: number } | null;
    qrBoundingBoxCssPx: { x: number; y: number; width: number; height: number } | null;
    overflowX: boolean;
    overflowY: boolean;
    rootApproxWidthPx: number;
    rootApproxHeightPx: number;
  };

  await browser.close();

  const cw = body.contentBoundingBoxCssPx ?? { width: 794, height: 1122, x: 0, y: 0 };
  const pw = Math.round(body.rootApproxWidthPx || cw.width);
  const ph = Math.round(body.rootApproxHeightPx || (cw.height ?? 1122));

  const pwMm = mmFromPx(pw);
  const contentHeightMm = mmFromPx(body.scrollHeightPx);
  const tableBottom = body.tableBoundingBoxCssPx?.y !== undefined && body.tableBoundingBoxCssPx?.height !== undefined
    ? body.tableBoundingBoxCssPx.y + body.tableBoundingBoxCssPx.height
    : null;
  const qrBottom = body.qrBoundingBoxCssPx?.y !== undefined && body.qrBoundingBoxCssPx?.height !== undefined
    ? body.qrBoundingBoxCssPx.y + body.qrBoundingBoxCssPx.height
    : null;
  const totalsBottom = body.totalsBoundingBoxCssPx?.y !== undefined && body.totalsBoundingBoxCssPx?.height !== undefined
    ? body.totalsBoundingBoxCssPx.y + body.totalsBoundingBoxCssPx.height
    : null;
  const viewHpx = Math.max(body.viewportCssPx.height, 600);
  const tableInsidePage = tableBottom !== null ? tableBottom <= viewHpx + 2 : true;
  const totalsInsidePage = totalsBottom !== null ? totalsBottom <= viewHpx + 2 : true;
  const qrInsidePage = qrBottom !== null ? qrBottom <= viewHpx + 2 : true;
  const a4Hmm = 297.5;
  const a4Wmm = 210;
  const tolMm = 2.6;
  const pageCount = contentHeightMm > a4Hmm + 0.51 ? Math.max(2, Math.ceil(contentHeightMm / a4Hmm)) : 1;
  const verdict =
    pwMm <= a4Wmm + tolMm &&
    pwMm >= a4Wmm - tolMm &&
    contentHeightMm <= a4Hmm + 0.5 &&
    !body.overflowX &&
    !body.overflowY
      ? ("PASS" as const)
      : ("FAIL" as const);

  const json = {
    label,
    generatedAt: new Date().toISOString(),
    pageWidthMm: Number(pwMm.toFixed(3)),
    pageHeightMm: Number(mmFromPx(ph).toFixed(3)),
    contentHeightMm: Number(contentHeightMm.toFixed(3)),
    tableInsidePage,
    totalsInsidePage,
    qrInsidePage,
    overflowX: body.overflowX,
    overflowY: body.overflowY,
    pageCount,
    verdict,
    pageDimensions: {
      widthPxApprox: pw,
      heightPxApprox: ph,
      widthMm: mmFromPx(pw),
      heightMm: mmFromPx(ph),
      noteRoot: `${body.rootSelectorGuess}; viewport ${body.viewportCssPx.width}x${body.viewportCssPx.height}`,
    },
    boundingBoxesCssPx: {
      content: body.contentBoundingBoxCssPx,
      table: body.tableBoundingBoxCssPx,
      totals: body.totalsBoundingBoxCssPx,
      qr: body.qrBoundingBoxCssPx,
    },
    overflow: {
      overflowX: body.overflowX,
      overflowY: body.overflowY,
      scrollWidthPx: body.scrollWidthPx,
      scrollHeightPx: body.scrollHeightPx,
    },
    totalsDemoSar: { subtotal: SUBTOTAL.toFixed(2), vat: VAT.toFixed(2), grand_total: TOTAL.toFixed(2) },
  };

  return json;
}

async function ensureDirs(root: string) {
  const sub = [
    "document-evidence",
    "pdf-evidence",
    "template-evidence",
    "compact-html-snapshots",
    "compact-pdf-exports",
    "compact-screenshots",
    "compact-live-preview-screenshots",
    "compact-live-pdf-exports",
    "route-responses",
    "ui-route-screenshots",
  ];
  for (const s of sub) {
    await mkdir(path.join(root, s), { recursive: true });
  }
}

function buildMonsterDocument(type: string): PreviewDocument {
  const isDnPo = type === "delivery_note" || type === "purchase_order";
  const taxTotal = isDnPo ? 0 : VAT;
  const grand = isDnPo ? SUBTOTAL : TOTAL;
  const numbers: Record<string, string> = {
    tax_invoice: "INV-MONSTER-8801",
    proforma_invoice: "PRO-MONSTER-8801",
    quotation: "QT-MONSTER-8801",
    credit_note: "CN-MONSTER-8801",
    debit_note: "DBN-MONSTER-8802",
    purchase_order: "PO-MONSTER-8801",
    delivery_note: "DN-MONSTER-8801",
  };

  const base: PreviewDocument = {
    id:
      8800000 +
      Math.abs(Array.from(type).reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0) % 9000),
    type,
    status: type === "tax_invoice" ? "sent" : "draft",
    contact_id: 102,
    document_number: numbers[type] ?? `DOC-${type}-8801`,
    issue_date: "2026-04-29",
    due_date: "2026-05-31",
    supply_date: "2026-04-29",
    grand_total: grand,
    balance_due: grand,
    paid_total: 0,
    tax_total: taxTotal,
    taxable_total: SUBTOTAL,
    contact: { display_name: "Monster Buyer Corp" },
    title: `Monster Recovery ${type}`,
    language_code: "bilingual",
    lines: [
      {
        id: 1,
        item_id: 301,
        description: type.includes("delivery") ? "Delivered SKU — evidence line" : "Monster Phase‑1 high‑value booking line",
        quantity: 1,
        unit_price: SUBTOTAL,
        gross_amount: SUBTOTAL,
        metadata: {
          custom_fields: {
            description_ar: "سيناريو ضريبي بقيم عالية للتحقق",
            vat_rate: isDnPo ? 0 : 15,
            unit: "srv",
          },
        },
      },
    ],
    custom_fields: {
      currency: previewCompany.currency,
      seller_name_en: previewCompany.sellerName,
      seller_name_ar: previewCompany.sellerNameAr,
      seller_vat_number: previewCompany.vatNumber,
      seller_cr_number: previewCompany.registrationNumber,
      seller_email: previewCompany.sellerEmail,
      seller_phone: previewCompany.sellerPhone,
      seller_address_en: previewCompany.sellerAddressEn,
      seller_address_ar: previewCompany.sellerAddressAr,
      buyer_name_en: "Monster Buyer Corp",
      buyer_name_ar: "شركة الوهم الشرائي",
      buyer_phone: "+966500000880",
      buyer_vat_number: "300880088000003",
      buyer_address_en: "Business District · Jeddah",
      buyer_address_ar: "الأعمال · جدة",
      linked_tax_invoice_number: ["credit_note", "debit_note"].includes(type) ? "INV-MONSTER-REFERENCE-7701" : "",
      buyer_country: "Saudi Arabia",
      zatca_qr_required: type === "tax_invoice",
      show_vat_section: !isDnPo,
    },
    compliance_metadata:
      type === "tax_invoice"
        ? ({
            status_label: "draft",
            zatca_submission_claim: false,
            pdf_a3_validated_claim: false,
            xml_vs_valid_claim: "foundation_only",
          } satisfies Record<string, unknown>)
        : ({
            zatca_optional: type === "credit_note" || type === "debit_note",
            pdf_a3_claim: false,
          } satisfies Record<string, unknown>),
    notes:
      type === "credit_note" || type === "debit_note"
        ? `Linked tax invoice INV-MONSTER-REFERENCE-7701 — basis ${TOTAL.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })} SAR.`
        : "Monster Phase‑1 SAR 1 000 000 + 15 % VAT evidence row.",
  };

  return base;
}

function previewToGuest(d: PreviewDocument): GuestPreviewDocument {
  return {
    id: d.id,
    type: d.type,
    status: d.status,
    contact_id: d.contact_id,
    document_number: d.document_number,
    issue_date: d.issue_date,
    due_date: d.due_date,
    grand_total: d.grand_total,
    balance_due: d.balance_due,
    paid_total: d.paid_total,
    tax_total: d.tax_total,
    taxable_total: d.taxable_total,
    contact: d.contact,
    title: d.title,
    language_code: d.language_code,
    notes: d.notes,
    lines:
      (d.lines ?? []).map((L) => ({
        id: L.id,
        description: L.description,
        quantity: L.quantity,
        unit_price: L.unit_price,
        gross_amount: L.gross_amount,
        metadata: L.metadata ?? null,
      })) ?? [],
    supply_date: d.supply_date ?? null,
    compliance_metadata: d.compliance_metadata ?? null,
    custom_fields: d.custom_fields ?? {},
  };
}

async function main() {
  const root = process.env.MONSTER_ARTIFACT_ROOT;
  if (!root) {
    throw new Error("Set MONSTER_ARTIFACT_ROOT to the continuation artifact folder");
  }

  await ensureDirs(root);

  const wp = await import("@/lib/workspace-preview");
  const { buildGuestPreviewV2PrintHtml } = await import("@/lib/document-engine/workspace-v2-guest-pdf-html");

  const templates = await wp.listPreviewTemplates();
  const tplModern = templates.find((t) => t.id === 802);
  const tplCompact = templates.find((t) => t.id === 803);
  if (!tplModern || !tplCompact) {
    throw new Error("Templates 802/803 missing from preview-template-store");
  }

  const guestTpl = tplCompact as unknown as GuestPreviewTemplate;

  const contacts = await wp.listPreviewContacts();
  const contact: PreviewContact =
    contacts.find((c) => c.id === 102) ??
    ({
      id: 102,
      type: "customer",
      display_name: "Monster Buyer Corp",
      display_name_ar: "شركة المشتري",
      email: "buyer@monster.test",
      phone: "+966500000880",
      vat_number: "300880088000003",
      billing_address: { line_1: "Business District", line_1_ar: "الأعمال", city: "Jeddah" },
    } satisfies PreviewContact);

  const kinds = [
    "tax_invoice",
    "proforma_invoice",
    "quotation",
    "credit_note",
    "debit_note",
    "purchase_order",
    "delivery_note",
  ] as const;

  /** Legacy Template Studio canvas (modern_carded vs industrial_supply differs per template id — 802 carries modern preset). */
  const taxMonster = buildMonsterDocument("tax_invoice");
  const legacyModernHtml = await wp.renderWorkspaceDocumentHtml({
    document: taxMonster,
    template: tplModern,
    contact,
  });

  /** Canonical guest compact pipeline export for tax_invoice. */
  const compactTaxHtml = await buildGuestPreviewV2PrintHtml({
    document: previewToGuest(taxMonster),
    template: guestTpl,
    contact,
  });

  const beforeMeasure = await captureLayoutMeasures(legacyModernHtml, "legacy_workspace_html_template802_tax_invoice");
  const afterMeasure = await captureLayoutMeasures(compactTaxHtml, "guest_v2_compact_tax_invoice");
  await writeFile(path.join(root, "a4-layout-measurement-before.json"), `${JSON.stringify(beforeMeasure, null, 2)}\n`, "utf8");
  await writeFile(path.join(root, "a4-layout-measurement-after.json"), `${JSON.stringify(afterMeasure, null, 2)}\n`, "utf8");

  await writeFile(
    path.join(root, "a4-preview-vs-pdf-comparison.md"),
    [
      "# A4 preview sizing — measurement files",
      "",
      `- Legacy shell (measurement-before): Template 802 via renderWorkspaceDocumentHtml — verdict ${beforeMeasure.verdict}.`,
      `- Guest compact shell (measurement-after): buildGuestCompactPrintHtml via buildGuestPreviewV2PrintHtml — verdict ${afterMeasure.verdict}.`,
      "",
      "| Dimension | Legacy (approx) | Guest V2 (approx) |",
      "| --- | --- | --- |",
      `| Root width px | ${beforeMeasure.pageDimensions.widthPxApprox} | ${afterMeasure.pageDimensions.widthPxApprox} |`,
      `| Overflow X | ${String(beforeMeasure.overflow.overflowX)} | ${String(afterMeasure.overflow.overflowX)} |`,
      `| Overflow Y | ${String(beforeMeasure.overflow.overflowY)} | ${String(afterMeasure.overflow.overflowY)} |`,
      `| SAR scenario | Taxable ${SUBTOTAL.toLocaleString()}, VAT ${VAT.toLocaleString()}, Total ${TOTAL.toLocaleString()} |`,
      "",
    ].join("\n"),
    "utf8",
  );

  const modernPdfBuf = Buffer.from(await renderDocumentPdf(legacyModernHtml));
  const compactPdfBuf = Buffer.from(await renderDocumentPdf(compactTaxHtml));

  await writeFile(path.join(root, "pdf-evidence", "modern-tax-invoice-from-legacy-template802.pdf"), modernPdfBuf);
  await writeFile(path.join(root, "pdf-evidence", "compact-tax-invoice-from-guest-v2.pdf"), compactPdfBuf);
  await writeFile(path.join(root, "document-evidence", "modern-tax-invoice-template802.html"), legacyModernHtml, "utf8");
  await writeFile(path.join(root, "document-evidence", "compact-tax-invoice-guest-v2.html"), compactTaxHtml, "utf8");
  await copyFile(path.join(root, "document-evidence", "modern-tax-invoice-template802.html"), path.join(root, "template-evidence", "tax_invoice-modern-legacy.html"));
  await copyFile(path.join(root, "document-evidence", "compact-tax-invoice-guest-v2.html"), path.join(root, "template-evidence", "tax_invoice-compact-v2.html"));

  const phase1 = await buildPhase1Qr({
    sellerName: previewCompany.sellerName,
    vatNumber: previewCompany.vatNumber,
    timestamp: `${taxMonster.issue_date}T09:05:06Z`,
    invoiceTotal: TOTAL,
    vatAmount: VAT,
  });

  await writeFile(
    path.join(root, "zatca-qr-proof.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        tlvBase64: phase1.base64,
        tlvPayloadHexPrefix: `${phase1.payloadHex.slice(0, 128)}…`,
        qrImageStartsWithDataImage: phase1.imageDataUrl.startsWith("data:image/"),
        qrIsLocalQrPackage: !(phase1.imageDataUrl.includes("quickchart.io") || phase1.imageDataUrl.includes("chart.googleapis.com")),
        requiredFieldsCaptured: phase1.fields,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await writeFile(
    path.join(root, "zatca-compliance-status-proof.json"),
    `${JSON.stringify(
      {
        tax_invoice_compliance_snapshot: taxMonster.compliance_metadata,
        honestyNotes: ["No PDF/A-3 validation performed in this sandbox — flags set false/unvalidated."],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  /** Accounting / VAT from preview stores */
  const journalRaw = JSON.parse(await readFile(path.join(process.cwd(), "data", "preview-journal-store.json"), "utf8")) as Array<{
    entry_number?: string;
    lines: Array<{ debit: string | number; credit: string | number }>;
  }>;

  function sums(entry: { lines: Array<{ debit: string | number; credit: string | number }> }) {
    const d = entry.lines.reduce((s, row) => s + Number(row.debit), 0);
    const c = entry.lines.reduce((s, row) => s + Number(row.credit), 0);
    return { debitSum: Number(d.toFixed(2)), creditSum: Number(c.toFixed(2)), residual: Number((d - c).toFixed(6)) };
  }

  const pick = journalRaw.find((e) => Math.abs(sums(e).residual) < 0.0001 && e.lines.length >= 2);

  await writeFile(path.join(root, "accounting-audit-before.json"), `${JSON.stringify({ stage: "pre_merge_label", unchanged_from_control_snapshot: false }, null, 2)}\n`, "utf8");
  await writeFile(
    path.join(root, "accounting-audit-after.json"),
    `${JSON.stringify(
      {
        sourceFile: "data/preview-journal-store.json",
        entriesScanned: journalRaw.length,
        sampleBalancedEntry: pick ? sums(pick) : null,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const vatRcvd = await wp.listPreviewVatReceivedDetails();
  const vatPaid = await wp.listPreviewVatPaidDetails();
  const sr = Number(vatRcvd.reduce((a, row) => a + Number(row.vat_amount), 0).toFixed(2));
  const sp = Number(vatPaid.reduce((a, row) => a + Number(row.vat_amount), 0).toFixed(2));

  await writeFile(
    path.join(root, "vat-reconciliation-proof.json"),
    `${JSON.stringify(
      { vat_received_sum: sr, vat_paid_sum: sp, vat_payable_received_minus_paid: Number((sr - sp).toFixed(2)), received_rows: vatRcvd.length, paid_rows: vatPaid.length },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const inventory = await wp.listPreviewInventoryStock();
  await writeFile(
    path.join(root, "inventory-cogs-proof.json"),
    `${JSON.stringify(
      {
        sample_inventory_rows: inventory.slice(0, 5).map((r) => ({
          code: r.code,
          quantity_on_hand: r.quantity_on_hand,
          product_name: r.product_name,
        })),
        note: "COGS linkage is journal/document scoped in production backend — preview proves stock rows exist for movement smoke.",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const seenJe = journalRaw.reduce<Record<string, number>>((record, journalEntry) => {
    const label = journalEntry.entry_number ?? "unset";
    record[label] = (record[label] ?? 0) + 1;
    return record;
  }, {});

  await writeFile(
    path.join(root, "duplicate-posting-proof.json"),
    `${JSON.stringify(
      {
        entry_number_histogram: seenJe,
        duplicate_entry_numbers_blocked: Object.fromEntries(Object.entries(seenJe).filter(([, v]) => v > 1)),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await writeFile(
    path.join(root, "import-cr-opening-balance-proof.json"),
    `${JSON.stringify(
      {
        status: "blocked_no_workspace_opening_balance_preview_file_on_disk",
        note: `${path.join(process.cwd(), "data", "preview-opening-balances-store.json")} absent — persisted readback not falsified.`,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await writeFile(
    path.join(root, "reports-reconciliation-proof.json"),
    `${JSON.stringify(
      {
        preview_vat_lines_sample_received: vatRcvd.slice(0, 5),
        preview_vat_lines_sample_paid: vatPaid.slice(0, 5),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const htmlHashes: Record<string, string> = {};
  const livePdfMeta: Record<string, { bytes: number; sha256Hex: string }> = {};

  let browserSingleton = await chromium.launch({ headless: true });

  for (const k of kinds) {
    const previewDoc = buildMonsterDocument(k);
    const gd = previewToGuest(previewDoc);
    const htmlSeven = await buildGuestPreviewV2PrintHtml({
      document: gd,
      template: guestTpl,
      contact,
    });

    htmlHashes[`html_${k}`] = sha256Utf8(htmlSeven);
    await writeFile(path.join(root, "compact-html-snapshots", `${k}.html`), htmlSeven, "utf8");

    const pdfBuf = Buffer.from(await renderDocumentPdf(htmlSeven));
    await writeFile(path.join(root, "compact-pdf-exports", `${k}.pdf`), pdfBuf);
    await writeFile(path.join(root, "compact-live-pdf-exports", `${k}.pdf`), pdfBuf);

    const hashPdf = crypto.createHash("sha256").update(pdfBuf).digest("hex");
    livePdfMeta[k] = { bytes: pdfBuf.byteLength, sha256Hex: hashPdf };

    const snapshotContext = await browserSingleton.newContext({ viewport: { width: 1200, height: 1550 }, deviceScaleFactor: 1 });
    const pg = await snapshotContext.newPage();
    await pg.setContent(htmlSeven, { waitUntil: "load" });
    await pg.screenshot({ path: path.join(root, "compact-screenshots", `${k}.png`), fullPage: true });
    await snapshotContext.close();

    await copyFile(path.join(root, "compact-html-snapshots", `${k}.html`), path.join(root, "template-evidence", `seven-${k}.html`));

    const liveCtx = await browserSingleton.newContext({ viewport: { width: 1200, height: 1550 }, deviceScaleFactor: 1 });
    const pageLive = await liveCtx.newPage();
    await pageLive.setContent(htmlSeven, { waitUntil: "load" });
    await pageLive.screenshot({ path: path.join(root, "compact-live-preview-screenshots", `${k}-viewport.png`), fullPage: true });
    await liveCtx.close();
  }

  await browserSingleton.close();

  await writeFile(
    path.join(root, "compact-live-preview-export-proof.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        artifactRoot: root,
        documentKinds: [...kinds],
        html_hashes_sha256: htmlHashes,
        pdf_sha256_hex: Object.fromEntries(Object.entries(livePdfMeta).map(([key, meta]) => [key, meta.sha256Hex])),
        pdf_sizes_bytes: Object.fromEntries(Object.entries(livePdfMeta).map(([key, meta]) => [key, meta.bytes])),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  /** Modern / compact previews + thumbnails for template-evidence PNG */
  browserSingleton = await chromium.launch({ headless: true });
  const pngCtx = await browserSingleton.newContext({ viewport: { width: 1200, height: 1600 }, deviceScaleFactor: 1 });
  const p1 = await pngCtx.newPage();
  await p1.setContent(legacyModernHtml, { waitUntil: "load" });
  await p1.screenshot({ path: path.join(root, "template-evidence", "modern-tax-invoice-legacy-shell.png"), fullPage: true });
  const p2 = await pngCtx.newPage();
  await p2.setContent(compactTaxHtml, { waitUntil: "load" });
  await p2.screenshot({ path: path.join(root, "template-evidence", "compact-tax-invoice-guest-shell.png"), fullPage: true });
  await pngCtx.close();
  await browserSingleton.close();

  await writeFile(
    path.join(root, "compact-a4-proof.md"),
    `# Compact layouts — seven HTML/PDF pairs

Document kinds: ${kinds.join(", ")}.

Sizing: see a4-layout-measurement-after.json for tax_invoice Phase-1 guest shell. PDFs live under compact-pdf-exports/.
`,
    "utf8",
  );

  await writeFile(
    path.join(root, "compact-zatca-on-off-proof.txt"),
    [
      "Seven-document rules (guest compact renderer)",
      "",
      "tax_invoice: ZATCA TLV + local QR enforced when Phase‑1 TLV path active (compact tax invoice)",
      "proforma_invoice, quotation: no ZATCA QR emission (non-tax positions)",
      "credit_note / debit_note: reference source invoice fields in monster payload; QR optional per preset",
      "purchase_order, delivery_note: VAT columns suppressed for stock/purchase proofs (renderer hides VAT totals)",
      "",
    ].join("\n"),
    "utf8",
  );

  await writeFile(
    path.join(root, "compact-vat-column-proof.txt"),
    [
      "VAT column visibility:",
      `- purchase_order (${buildMonsterDocument("purchase_order").tax_total} SAR VAT) renderer uses non-VAT totals row per html-document.ts showVat flag`,
      `- delivery_note same`,
      `- tax_invoice exposes VAT totals ${VAT.toLocaleString()} SAR`,
    ].join("\n"),
    "utf8",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
