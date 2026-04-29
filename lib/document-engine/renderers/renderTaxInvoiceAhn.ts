import type { TaxInvoiceAhnContract } from "@/lib/document-engine/contracts/taxInvoiceAhnContract";
import { TaxInvoiceAhnTemplate } from "@/lib/document-engine/templates/TaxInvoiceAhnTemplate";
import { ARABIC_FONT_STACK_LITERAL } from "@/lib/workspace/arabic-font-stack";

export function getTaxInvoiceAhnCss() {
  return `
    .ahn-tax-invoice{font-family:${ARABIC_FONT_STACK_LITERAL};color:#13221c;background:#fff;padding:12mm;display:grid;gap:10px}
    .ahn-header{display:grid;gap:8px;border-bottom:1px solid #d9e3db;padding-bottom:8px}
    .ahn-seller-block{display:grid;grid-template-columns:92px 1fr;gap:10px;align-items:start}
    .ahn-logo-wrap{width:92px;height:70px;border:1px solid #d9e3db;background:#f7fbf8;border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .ahn-logo{max-width:100%;max-height:100%;object-fit:contain}
    .ahn-title-row{display:flex;justify-content:space-between;align-items:end;border-top:1px solid #ecf1ed;padding-top:6px}
    .ahn-title-en{font-size:21px;font-weight:800;letter-spacing:.04em}
    .ahn-title-ar{font-size:18px;font-weight:700}
    .ahn-ar{font-family:${ARABIC_FONT_STACK_LITERAL}}
    .ahn-muted{color:#617469;font-size:11px}
    .ahn-meta-line{font-size:11px;color:#2e463c}
    .ahn-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;background:#f7fbf8;border:1px solid #d9e3db;border-radius:6px;padding:8px}
    .ahn-meta-grid div{display:grid;gap:2px}
    .ahn-meta-grid span{font-size:10px;font-weight:600;color:#617469;text-transform:uppercase;letter-spacing:.04em}
    .ahn-meta-grid strong{font-size:12px}
    .ahn-lines{width:100%;border-collapse:collapse;font-size:11px;border:1px solid #d9e3db;font-family:inherit}
    .ahn-lines th,.ahn-lines td{border:1px solid #d9e3db;padding:5px 6px;vertical-align:top;font-family:inherit}
    .ahn-lines thead th{background:#eff5f1;font-size:10px;text-transform:uppercase;letter-spacing:.03em}
    .ahn-lines .is-right{text-align:right;white-space:nowrap}
    .ahn-qrcode-note{border:1px dashed #b9cbbf;background:#f9fcfa;border-radius:6px;padding:6px 8px;font-size:11px}
    .ahn-totals{margin-left:auto;width:min(360px,100%);display:grid;gap:4px;border:1px solid #d9e3db;background:#f7fbf8;border-radius:6px;padding:8px}
    .ahn-totals div{display:flex;justify-content:space-between;gap:8px;font-size:11px}
    .ahn-totals .ahn-grand{font-weight:800;border-top:1px solid #d9e3db;padding-top:4px;font-size:12px}
    .ahn-notes{font-size:11px;color:#20342a}
    .ahn-footer{border-top:1px solid #d9e3db;padding-top:6px;display:grid;gap:5px;font-size:10px;color:#5f7267}
    .ahn-footer-assets{display:flex;gap:8px;align-items:center}
    .ahn-stamp,.ahn-signature{max-height:44px;max-width:130px;object-fit:contain}
  `;
}

export function renderTaxInvoiceAhn(contract: TaxInvoiceAhnContract) {
  return `<style>${getTaxInvoiceAhnCss()}</style>${TaxInvoiceAhnTemplate({ contract })}`;
}
