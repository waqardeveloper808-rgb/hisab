import { buildPhase1Qr } from "@/lib/workspace/exports/qr";
import type { BuildPdfInput } from "@/lib/workspace/exports/pdf";
import {
  PAGE_GEOMETRY,
  SPACING,
  TYPOGRAPHY,
  COLORS,
} from "@/lib/workspace/document-template-schemas";
import { buildDocumentLayout } from "@/lib/workspace/document-template-renderer";

function escapeHtml(value: string | null | undefined): string {
  return (value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function nlToBr(value: string | null | undefined): string {
  return escapeHtml(value).replaceAll("\n", "<br>");
}

function resolveOrigin(): string {
  const fallback = "http://127.0.0.1:3000";
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || fallback;
}

function renderInfoTable(
  rows: Array<{ labelEn: string; labelAr: string; value: string }>,
  language: "english" | "arabic" | "bilingual",
): string {
  const grid = `grid-template-columns:minmax(58px, 112px) minmax(94px, 1fr) minmax(58px, 112px);`;
  return `
    <div style="padding:0 8px 8px;box-sizing:border-box;display:flex;flex-direction:column;gap:4px;">
      ${rows
        .map((row) => {
          const en = language === "arabic" ? "&nbsp;" : escapeHtml(row.labelEn);
          const ar = language === "english" ? "&nbsp;" : escapeHtml(row.labelAr);
          return `
            <div style="display:grid;${grid}column-gap:8px;align-items:start;padding:2px 0;">
              <div dir="ltr" lang="en" style="font-size:9px;line-height:1.28;color:${COLORS.ink};padding:2px 4px;overflow-wrap:anywhere;word-break:break-word;">${en}</div>
              <div dir="${/[\u0600-\u06ff]/.test(row.value) ? "rtl" : "ltr"}" style="font-size:9px;line-height:1.28;color:${COLORS.ink};padding:2px 4px;overflow-wrap:anywhere;word-break:break-word;unicode-bidi:plaintext;justify-self:center;text-align:center;">${row.value ? escapeHtml(row.value) : "—"}</div>
              <div dir="rtl" lang="ar" style="font-size:9px;line-height:1.28;color:${COLORS.ink};padding:2px 4px;overflow-wrap:anywhere;word-break:break-word;text-align:right;">${ar}</div>
            </div>`;
        })
        .join("")}
    </div>`;
}

function renderHeaderCard(
  title: string,
  lines: string[],
  align: "left" | "center" | "right",
  direction: "ltr" | "rtl",
  color: string,
): string {
  return `
    <div style="flex:1 1 0;min-width:0;max-width:100%;height:108px;max-height:108px;overflow:hidden;border:1px solid ${COLORS.border};border-radius:4px;background:#fff;padding:8px;display:flex;flex-direction:column;align-items:${align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center"};justify-content:flex-start;gap:3px;color:${color};">
      <div dir="${direction}" style="font-size:12px;line-height:1.14;font-weight:700;overflow-wrap:anywhere;word-break:break-word;text-align:${align};">${escapeHtml(title)}</div>
      ${lines
        .filter(Boolean)
        .map((line) => `<div dir="${direction}" style="font-size:8px;line-height:1.22;overflow-wrap:anywhere;word-break:break-word;text-align:${align};">${nlToBr(line)}</div>`)
        .join("")}
    </div>`;
}

function renderItemsTable(input: BuildPdfInput, language: "english" | "arabic" | "bilingual"): string {
  const layout = buildDocumentLayout({
    schema: input.schema,
    doc: input.doc,
    seller: input.seller,
    customer: input.customer,
    language,
    hiddenSections: input.hiddenSections,
    hiddenFields: input.hiddenFields,
    hiddenColumns: input.hiddenColumns,
    columnOrder: input.columnOrder,
    templateId: input.templateId,
    ui: input.ui,
  });

  const cols = layout.itemColumns;
  const sumW = Math.max(1, cols.reduce((s, c) => s + c.widthPx, 0));
  const colDefs = cols
    .map((c) => `<col style="width:${(c.widthPx / sumW) * 100}%">`)
    .join("");

  const headerLines = cols
    .map((c) => {
      const en = language === "arabic" ? "&nbsp;" : escapeHtml(c.labelEn);
      const ar = language === "english" ? "&nbsp;" : escapeHtml(c.labelAr);
      return `
        <th style="font-size:9px;line-height:1.2;border:1px solid ${COLORS.border};padding:5px 4px;color:${COLORS.ink};vertical-align:top;white-space:${c.key === "description" ? "normal" : "nowrap"};text-align:${c.align};overflow-wrap:${c.key === "description" ? "anywhere" : "normal"};">
          <div>${en}</div>
          <div dir="rtl" lang="ar" style="font-size:8px;font-weight:600;color:${COLORS.ink};margin-top:1px;unicode-bidi:plaintext;">${ar}</div>
        </th>`;
    })
    .join("");

  const rows = layout.itemRows
    .map((row) => {
      const cells = cols
        .map((col) => {
          const value = row.cells[col.key] ?? "";
          const nowrap = col.key !== "description";
          return `
            <td style="font-size:9px;line-height:1.22;border:1px solid ${COLORS.border};padding:4px;vertical-align:top;text-align:${col.align};white-space:${nowrap ? "nowrap" : "normal"};overflow-wrap:${nowrap ? "normal" : "anywhere"};word-break:${nowrap ? "normal" : "break-word"};unicode-bidi:plaintext;">
              ${escapeHtml(value)}
            </td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;border:1px solid ${COLORS.border};">
      <colgroup>${colDefs}</colgroup>
      <thead style="background:${layout.headerRowColor};">${headerLines}</thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export async function buildTemplateStudioPdfHtml(input: BuildPdfInput): Promise<string> {
  const language = input.language ?? "bilingual";
  const style = input.templateStyle ?? "standard";
  const layout = buildDocumentLayout({
    schema: input.schema,
    doc: input.doc,
    seller: input.seller,
    customer: input.customer,
    language,
    hiddenSections: input.hiddenSections,
    hiddenFields: input.hiddenFields,
    hiddenColumns: input.hiddenColumns,
    columnOrder: input.columnOrder,
    templateId: input.templateId,
    ui: input.ui,
  });

  const origin = resolveOrigin();
  const qrDataUrl =
    input.qrPngDataUrl ??
    (layout.qr.applicable
      ? (await buildPhase1Qr({
          sellerName: input.seller.name,
          vatNumber: input.seller.vatNumber,
          invoiceTotal: input.doc.total,
          vatAmount: input.doc.vat,
          timestamp: new Date(input.doc.issueDate).toISOString(),
        })).imageDataUrl
      : null);

  const logoDataUrl = input.templateAssets?.logoDataUrl ?? null;
  const stampDataUrl = input.templateAssets?.stampDataUrl ?? null;
  const signatureDataUrl = input.templateAssets?.signatureDataUrl ?? null;

  const header = `
    <div style="display:grid;grid-template-columns:minmax(0,1fr) 88px minmax(0,1fr);gap:${SPACING.sectionGapPx}px;width:100%;align-items:stretch;">
      ${renderHeaderCard(
        layout.seller.nameEn || "Seller",
        [
          layout.seller.addressEn,
          layout.seller.email,
          layout.seller.vatValue ? `${layout.seller.vatLabelEn} ${layout.seller.vatValue}` : "",
          layout.seller.crValue ? `${layout.seller.crLabelEn} ${layout.seller.crValue}` : "",
        ],
        "left",
        "ltr",
        layout.textColors.english,
      )}
      <div style="height:108px;max-height:108px;min-height:108px;border:1px solid ${COLORS.border};border-radius:4px;padding:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;">
        ${
          logoDataUrl
            ? `<img alt="" src="${logoDataUrl}" style="display:block;max-width:100%;max-height:100%;object-fit:contain;">`
            : `<div style="width:64px;height:48px;border:1px solid ${COLORS.borderLight};border-radius:4px;"></div>`
        }
      </div>
      ${renderHeaderCard(
        layout.seller.nameAr || layout.seller.nameEn || "البائع",
        [
          layout.seller.addressAr,
          layout.seller.email,
          layout.seller.vatValue ? `${layout.seller.vatLabelAr} ${layout.seller.vatValue}` : "",
          layout.seller.crValue ? `${layout.seller.crLabelAr} ${layout.seller.crValue}` : "",
        ],
        "right",
        "rtl",
        layout.textColors.arabic,
      )}
    </div>`;

  const title = `
    <div style="padding-top:2px;padding-bottom:2px;text-align:center;line-height:1.1;">
      <div style="font-size:${TYPOGRAPHY.titleEnPx}px;font-weight:700;color:${layout.textColors.english};">
        ${escapeHtml(layout.title.en)}
      </div>
      <div dir="rtl" lang="ar" style="font-size:${TYPOGRAPHY.titleArPx}px;font-weight:700;color:${layout.textColors.arabic};unicode-bidi:plaintext;">
        ${escapeHtml(layout.title.ar)}
      </div>
    </div>`;

  const customerRows = layout.customerRows.map((row) => ({
    labelEn: row.labelEn,
    labelAr: row.labelAr,
    value: row.value,
  }));

  const docRows = layout.documentInfoRows.map((row) => ({
    labelEn: row.labelEn,
    labelAr: row.labelAr,
    value: row.value,
  }));

  const items = renderItemsTable(input, language);

  const infoCards =
    style === "modern"
      ? `
        <div style="display:flex;gap:${SPACING.sectionGapPx}px;width:100%;align-items:flex-start;">
          <div class="section-card" style="flex:1 1 0;min-width:0;">
            <div class="section-title">${language === "arabic" ? "العميل" : "Customer"}</div>
            ${renderInfoTable(customerRows, language)}
          </div>
          <div class="section-card" style="flex:1 1 0;min-width:0;">
            <div class="section-title">${language === "arabic" ? "بيانات المستند" : "Document Information"}</div>
            ${renderInfoTable(docRows, language)}
          </div>
        </div>`
      : `
        <div style="display:flex;flex-direction:column;gap:${SPACING.sectionGapPx}px;width:100%;">
          <div class="section-card">
            <div class="section-title">${language === "arabic" ? "العميل" : "Customer"}</div>
            ${renderInfoTable(customerRows, language)}
          </div>
          <div class="section-card">
            <div class="section-title">${language === "arabic" ? "بيانات المستند" : "Document Information"}</div>
            ${renderInfoTable(docRows, language)}
          </div>
        </div>`;

  const totals = `
    <div style="display:flex;gap:16px;align-items:flex-start;width:100%;box-sizing:border-box;">
      <div style="flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:6px;">
        ${
          qrDataUrl
            ? `<div style="width:96px;height:96px;border:1px solid ${COLORS.border};border-radius:4px;padding:4px;display:flex;align-items:center;justify-content:center;background:#fff;">
                <img alt="QR" src="${qrDataUrl}" style="width:100%;height:100%;object-fit:contain;display:block;">
              </div>`
            : ""
        }
        <div style="font-size:8px;color:${COLORS.inkSubtle};line-height:1.3;">${escapeHtml(layout.qr.captionEn)}</div>
        <div dir="rtl" lang="ar" style="font-size:8px;color:${COLORS.inkSubtle};line-height:1.3;unicode-bidi:plaintext;">${escapeHtml(layout.qr.captionAr)}</div>
      </div>
      <div style="width:${layout.sections.find((s) => s.id === "totals")?.widthPx ?? 284}px;flex:0 0 auto;display:flex;flex-direction:column;gap:6px;">
        ${layout.totalsRows
          .map((row) => `
            <div style="display:grid;grid-template-columns:minmax(0,1fr) 30px 92px;column-gap:10px;align-items:center;padding:2px 0;">
              <div style="font-size:${row.emphasis ? 11 : 9}px;font-weight:${row.emphasis ? 700 : 400};color:${layout.textColors.english};line-height:1.22;overflow-wrap:anywhere;word-break:break-word;">${language === "arabic" ? escapeHtml(row.labelAr) : escapeHtml(row.labelEn)}</div>
              <div style="font-size:${row.emphasis ? 11 : 9}px;font-weight:${row.emphasis ? 700 : 400};color:${layout.textColors.english};white-space:nowrap;text-align:center;">${escapeHtml(row.currencySymbol)}</div>
              <div style="font-size:${row.emphasis ? 11 : 9}px;font-weight:${row.emphasis ? 700 : 400};color:${layout.textColors.english};white-space:nowrap;text-align:right;">${escapeHtml(row.amountOnly)}</div>
            </div>`)
          .join("")}
      </div>
    </div>`;

  const stampSignature = layout.stampSignature.enabled
    ? `
      <div style="display:grid;grid-template-columns:repeat(${layout.stampSignature.showStamp && layout.stampSignature.showSignature ? 2 : 1}, minmax(0,1fr));gap:8px;width:100%;align-items:start;">
        ${
          layout.stampSignature.showStamp
            ? `<div style="border:1px solid ${COLORS.border};border-radius:4px;background:#fff;padding:8px;min-height:100px;display:flex;flex-direction:column;justify-content:space-between;">
                <div style="display:flex;align-items:center;justify-content:center;min-height:60px;">
                  ${
                    stampDataUrl
                      ? `<img alt="" src="${stampDataUrl}" style="max-width:100%;max-height:60px;object-fit:contain;display:block;">`
                      : `<div style="width:100%;height:48px;border:1px dashed ${COLORS.borderLight};border-radius:4px;"></div>`
                  }
                </div>
                <div style="border-top:1px solid ${COLORS.borderLight};margin-top:6px;padding-top:4px;font-size:8px;color:${COLORS.ink};text-align:center;">Company Stamp / ختم الشركة</div>
              </div>`
            : ""
        }
        ${
          layout.stampSignature.showSignature
            ? `<div style="border:1px solid ${COLORS.border};border-radius:4px;background:#fff;padding:8px;min-height:100px;display:flex;flex-direction:column;justify-content:space-between;">
                <div style="display:flex;align-items:center;justify-content:center;min-height:60px;">
                  ${
                    signatureDataUrl
                      ? `<img alt="" src="${signatureDataUrl}" style="max-width:100%;max-height:60px;object-fit:contain;display:block;">`
                      : `<div style="width:100%;height:48px;border:1px dashed ${COLORS.borderLight};border-radius:4px;"></div>`
                  }
                </div>
                ${
                  input.templateAssets?.signatoryName
                    ? `<div style="font-size:8px;color:${COLORS.ink};text-align:center;margin-top:2px;">${escapeHtml(input.templateAssets.signatoryName)}</div>`
                    : ""
                }
                ${
                  input.templateAssets?.signatoryDesignation
                    ? `<div style="font-size:8px;color:${COLORS.inkSubtle};text-align:center;">${escapeHtml(input.templateAssets.signatoryDesignation)}</div>`
                    : ""
                }
                <div style="border-top:1px solid ${COLORS.borderLight};margin-top:6px;padding-top:4px;font-size:8px;color:${COLORS.ink};text-align:center;">Authorized Signature / التوقيع المعتمد</div>
              </div>`
            : ""
        }
      </div>`
    : "";

  const footer = `
    <div style="display:flex;justify-content:space-between;align-items:center;width:100%;font-size:8px;color:${layout.textColors.english};padding-top:2px;">
      <div style="overflow-wrap:anywhere;word-break:break-word;max-width:85%;">${escapeHtml(layout.seller.nameEn)}${layout.seller.nameAr ? ` · ${escapeHtml(layout.seller.nameAr)}` : ""}</div>
      <div>Page 1 / 1</div>
    </div>`;

  const html = `
    <!doctype html>
    <html lang="${language === "arabic" ? "ar" : "en"}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          @font-face {
            font-family: "HisabixNotoArabic";
            src: url("${origin}/fonts/NotoSansArabic-Regular.ttf") format("truetype");
            font-display: swap;
          }
          @page { size: A4 portrait; margin: 0; }
          html, body {
            width: ${PAGE_GEOMETRY.widthPx}px;
            height: ${PAGE_GEOMETRY.heightPx}px;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #fff;
          }
          body {
            box-sizing: border-box;
            color: ${COLORS.ink};
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            text-rendering: geometricPrecision;
          }
          * { box-sizing: border-box; }
          .ar, [dir="rtl"] { font-family: "HisabixNotoArabic", "Segoe UI", Tahoma, sans-serif; }
          .page {
            position: relative;
            width: ${PAGE_GEOMETRY.widthPx}px;
            height: ${PAGE_GEOMETRY.heightPx}px;
            padding: ${PAGE_GEOMETRY.safeMarginTopPx}px ${PAGE_GEOMETRY.safeMarginRightPx}px ${PAGE_GEOMETRY.safeMarginBottomPx}px ${PAGE_GEOMETRY.safeMarginLeftPx}px;
            background: #fff;
            display: flex;
            flex-direction: column;
            gap: ${SPACING.sectionGapPx}px;
            overflow: hidden;
          }
          .section-card {
            border: 1px solid ${COLORS.border};
            border-radius: 4px;
            background: #fff;
            overflow: hidden;
          }
          .section-title {
            background: ${layout.headerRowColor};
            min-height: 26px;
            padding: 4px 6px;
            font-size: 9px;
            font-weight: 700;
            line-height: 1.2;
          }
          .page[data-style="modern"] {
            background: #eff6ff;
          }
          .page[data-style="modern"] .section-card {
            border-radius: 12px;
            overflow: hidden;
          }
          .page[data-style="modern"] .section-title {
            background: #e0ecff;
          }
          .page[data-style="compact"] {
            gap: ${Math.max(8, SPACING.sectionGapPx - 1)}px;
          }
        </style>
      </head>
      <body>
        <div class="page" data-style="${style}">
          ${header}
          ${title}
          ${infoCards}
          <div class="section-card" style="padding:0;">
            ${items}
          </div>
          ${totals}
          ${stampSignature}
          ${footer}
        </div>
      </body>
    </html>`;

  return html;
}
