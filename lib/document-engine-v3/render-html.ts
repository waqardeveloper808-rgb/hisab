import { buildZatcaQrV3, isZatcaEligibleV3 } from "./qr-zatca";
import type { V3RenderInput, V3TemplateStyle } from "./types";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function titleByType(type: string): string {
  if (type === "quotation") return "Quotation / عرض سعر";
  if (type === "proforma_invoice") return "Proforma Invoice / فاتورة أولية";
  if (type === "credit_note") return "Credit Note / إشعار دائن";
  if (type === "debit_note") return "Debit Note / إشعار مدين";
  if (type === "delivery_note") return "Delivery Note / إشعار تسليم";
  return "Tax Invoice / فاتورة ضريبية";
}

function styleTokens(style: V3TemplateStyle): { surface: string; accent: string; card: string; compact: boolean } {
  if (style === "modern") return { surface: "#f8fafc", accent: "#0e7490", card: "#ecfeff", compact: false };
  if (style === "compact") return { surface: "#effcf6", accent: "#1d4ed8", card: "#dcfce7", compact: true };
  return { surface: "#ffffff", accent: "#0f172a", card: "#f1f5f9", compact: false };
}

export function renderDocumentPreviewV3(input: V3RenderInput): { html: string; qrRendered: boolean; totalsRendered: boolean } {
  const { document, style } = input;
  const t = styleTokens(style);
  const qr = buildZatcaQrV3(document);
  const allowQr = isZatcaEligibleV3(document.type);
  const linesHtml = document.lines
    .map((line, index) => `<tr><td>${index + 1}</td><td>${line.description}</td><td>${money(line.quantity)}</td><td>${money(line.unitPrice)}</td><td>${money(line.amount ?? line.quantity * line.unitPrice)}</td></tr>`)
    .join("");

  const badge = document.type === "tax_invoice" ? `<span style="padding:4px 8px;border-radius:999px;background:#dbeafe;color:#1e3a8a;font-size:11px;">Original/Copy</span>` : "";
  const creditDebitMeta = (document.type === "credit_note" || document.type === "debit_note")
    ? `<div style="font-size:12px;color:#334155;">Ref: ${document.referenceDocumentNumber ?? "-"} | Reason: ${document.adjustmentReason ?? "-"}</div>`
    : "";

  const qrHtml = allowQr
    ? `<div style="padding:10px;border-radius:12px;background:${t.card};"><div style="font-weight:700;font-size:12px;margin-bottom:6px;">QR / رمز</div>${qr.svg}</div>`
    : "";

  const html = `<!doctype html><html><head><meta charset="utf-8"/><style>
    body{font-family:Segoe UI,Tahoma,Arial,sans-serif;background:${t.surface};margin:0;padding:22px;color:#0f172a}
    .shell{border:1px solid #cbd5e1;border-radius:18px;padding:${t.compact ? "16" : "22"}px;background:white}
    .top{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}
    .card{background:${t.card};border:1px solid #bfdbfe;border-radius:14px;padding:10px}
    .title{text-align:center;font-size:${t.compact ? "24" : "26"}px;color:${t.accent};font-weight:800;margin:14px 0}
    table{width:100%;border-collapse:collapse;font-size:${t.compact ? "12" : "13"}px}
    th,td{border:1px solid #dbeafe;padding:7px;vertical-align:top}
    th{background:#f8fafc;text-align:left}
    .totals{margin-left:auto;width:280px}
  </style></head><body><article class="shell" data-hisabix-document-engine="v3" data-document-type="${document.type}" data-template-style="${style}" data-template-id="${document.type}.${style}">
    <div class="top">
      <div class="card"><strong>${document.seller.nameEn ?? ""}</strong><br/>${document.seller.nameAr ?? ""}<br/>VAT: ${document.seller.vatNumber ?? "-"}</div>
      <div>${badge}</div>
    </div>
    <div class="title">${titleByType(document.type)}</div>
    <div class="top"><div class="card">Customer: ${document.customer.nameEn ?? "-"}<br/>${document.customer.nameAr ?? ""}</div><div class="card">No: ${document.number}<br/>Issue: ${document.issueDate}</div></div>
    ${creditDebitMeta}
    <table><thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead><tbody>${linesHtml}</tbody></table>
    <div style="display:flex;gap:14px;margin-top:12px;align-items:flex-start;">
      <div class="totals card"><div>Taxable: ${money(document.taxableTotal)} ${document.currency}</div><div>VAT: ${money(document.vatTotal)} ${document.currency}</div><div style="font-weight:800;">Grand: ${money(document.grandTotal)} ${document.currency}</div></div>
      ${qrHtml}
    </div>
  </article></body></html>`;
  return { html, qrRendered: allowQr, totalsRendered: true };
}
