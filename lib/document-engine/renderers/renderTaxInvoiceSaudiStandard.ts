import type { TaxInvoiceSaudiStandardContract } from "@/lib/document-engine/contracts/taxInvoiceSaudiStandardContract";
import { TaxInvoiceSaudiStandard } from "@/lib/document-engine/templates/TaxInvoiceSaudiStandard";
import { ARABIC_FONT_STACK_LITERAL } from "@/lib/workspace/arabic-font-stack";

export function getTaxInvoiceSaudiStandardCss() {
  return `
    .saudi-tax-invoice { font-family: ${ARABIC_FONT_STACK_LITERAL}; color: #172226; background: #ffffff; padding: 10mm; display: grid; gap: 10px; }
    .saudi-header { display: grid; gap: 8px; border-bottom: 1px solid #d5dce2; padding-bottom: 8px; }
    .saudi-top-seller { display: grid; grid-template-columns: 100px 1fr; gap: 10px; align-items: start; }
    .saudi-logo-wrap { width: 100px; height: 74px; border: 1px solid #d5dce2; border-radius: 4px; background: #f7f9fb; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .saudi-logo { max-width: 100%; max-height: 100%; object-fit: contain; }
    .saudi-company h1 { margin: 0; font-size: 19px; font-weight: 800; }
    .saudi-company p { margin: 2px 0; font-size: 11px; }
    .saudi-ar { direction: rtl; text-align: right; }
    .saudi-title { border-top: 1px solid #e8edf1; padding-top: 6px; display: flex; align-items: baseline; justify-content: space-between; }
    .saudi-title-en { font-size: 21px; font-weight: 800; letter-spacing: .06em; }
    .saudi-title-ar { font-size: 18px; font-weight: 700; }
    .saudi-meta { border: 1px solid #d5dce2; background: #fbfcfd; border-radius: 4px; padding: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; }
    .saudi-meta-cell { display: grid; gap: 2px; }
    .saudi-meta-label { font-size: 10px; color: #61717f; text-transform: uppercase; letter-spacing: .04em; font-weight: 700; }
    .saudi-meta-value { font-size: 12px; font-weight: 600; }
    .saudi-lines { width: 100%; border-collapse: collapse; border: 1px solid #d5dce2; font-size: 11px; font-family: inherit; }
    .saudi-lines th, .saudi-lines td { border: 1px solid #d5dce2; padding: 5px 6px; vertical-align: top; font-family: inherit; }
    .saudi-lines thead th { background: #edf2f7; font-size: 10px; text-transform: uppercase; letter-spacing: .03em; }
    .saudi-right { text-align: right; white-space: nowrap; }
    .saudi-qr-block { border: 1px dashed #b7c1cb; background: #f8fafb; border-radius: 4px; padding: 8px; display: grid; grid-template-columns: 96px 1fr; gap: 10px; align-items: center; }
    .saudi-qr-img { width: 92px; height: 92px; border: 1px solid #d5dce2; border-radius: 3px; background: #fff; }
    .saudi-qr-note p { margin: 2px 0; font-size: 11px; }
    .saudi-totals { margin-left: auto; width: min(360px, 100%); border: 1px solid #d5dce2; border-radius: 4px; background: #fbfcfd; padding: 8px; display: grid; gap: 4px; }
    .saudi-totals-row { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; }
    .saudi-totals-grand { border-top: 1px solid #d5dce2; padding-top: 4px; font-size: 12px; font-weight: 800; }
    .saudi-footer { border-top: 1px solid #d5dce2; padding-top: 6px; display: grid; gap: 4px; font-size: 10px; color: #54606b; }
    .saudi-footer-assets { display: flex; gap: 8px; align-items: center; }
    .saudi-stamp, .saudi-signature { max-height: 44px; max-width: 132px; object-fit: contain; }
  `;
}

export function renderTaxInvoiceSaudiStandard(contract: TaxInvoiceSaudiStandardContract) {
  return `<style>${getTaxInvoiceSaudiStandardCss()}</style>${TaxInvoiceSaudiStandard({ contract })}`;
}
