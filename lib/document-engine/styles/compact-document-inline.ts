import { ARABIC_FONT_STACK_LITERAL } from "@/lib/workspace/arabic-font-stack";

/** HisabiX compact invoice — navy / teal / brand green; A4-safe; pairs with CompactDocumentTemplate.tsx */
export const compactDocumentCss = `
.cd-document-root {
  --cd-navy: #0c2744;
  --cd-navy-mid: #15395a;
  --cd-teal: #0f766e;
  --cd-teal-soft: #ccfbf1;
  --cd-accent: #3FAE2A;
  --cd-accent-soft: rgba(63, 174, 42, 0.14);
  --cd-border: #c5d9e0;
  --cd-muted: #4a5f6f;
  font-family: ${ARABIC_FONT_STACK_LITERAL};
  color: var(--cd-navy);
  background: linear-gradient(180deg, #f4fbfa 0%, #ffffff 18%);
  box-sizing: border-box;
  width: 100%;
  max-width: 210mm;
  margin: 0 auto;
  padding: 10mm 11mm 11mm;
  font-size: 10.5px;
  line-height: 1.38;
  border: 1px solid var(--cd-border);
  border-radius: 2px;
}
.cd-document-root * { box-sizing: border-box; }
.cd-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px 14px;
  align-items: start;
  padding: 10px 8px 12px;
  margin-bottom: 10px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #dbe8ea;
  border-top: 4px solid var(--cd-accent);
  box-shadow: 0 1px 0 rgba(15, 39, 68, 0.06);
}
.cd-header-col { min-width: 0; }
.cd-header-center {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 8px 0;
}
.cd-logo-img {
  max-height: 68px;
  max-width: 152px;
  width: auto;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(12, 39, 68, 0.12));
}
.cd-h-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cd-teal);
  margin-bottom: 4px;
}
.cd-company-name {
  font-size: 12.5px;
  font-weight: 800;
  line-height: 1.25;
  margin-bottom: 4px;
  word-break: break-word;
  color: var(--cd-navy);
}
.cd-co-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 10px;
  margin-top: 3px;
}
.cd-co-k { font-weight: 700; color: var(--cd-muted); }
.cd-co-v { font-weight: 600; word-break: break-all; color: var(--cd-navy-mid); }
.cd-co-block {
  font-size: 10px;
  margin-top: 5px;
  word-break: break-word;
  color: #1e3a50;
}
.cd-co-contact {
  font-size: 10px;
  margin-top: 5px;
  color: var(--cd-muted);
  word-break: break-word;
}
.cd-title-section {
  text-align: center;
  margin: 10px 0 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(15, 118, 110, 0.35);
}
.cd-doc-title-stack {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.cd-doc-title-en-block {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--cd-navy);
  line-height: 1.15;
}
.cd-doc-title-ar-block {
  font-size: 17px;
  font-weight: 800;
  color: var(--cd-teal);
  line-height: 1.25;
}
.cd-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid rgba(63, 174, 42, 0.55);
  background: var(--cd-accent-soft);
  font-size: 11px;
  font-weight: 800;
  color: var(--cd-navy);
  letter-spacing: 0.04em;
}
.cd-badge-sep { opacity: 0.35; font-weight: 600; }
.cd-doc-meta-panel {
  margin-bottom: 12px;
}
.cd-meta-panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
  padding: 0 2px;
}
.cd-meta-panel-heading-en {
  font-size: 11px;
  font-weight: 800;
  color: var(--cd-navy);
  letter-spacing: 0.03em;
}
.cd-meta-panel-heading-ar {
  font-size: 11px;
  font-weight: 800;
  color: var(--cd-teal);
}
.cd-meta-panel-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
@media (max-width: 720px) {
  .cd-meta-panel-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.cd-mp-cell {
  background: #ffffff;
  border: 1px solid #cfe8e4;
  border-radius: 8px;
  padding: 8px 10px;
  border-left: 4px solid var(--cd-teal);
  box-shadow: 0 1px 2px rgba(12, 39, 68, 0.05);
}
.cd-mp-label-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.cd-mp-le {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--cd-muted);
}
.cd-mp-la {
  font-size: 9px;
  font-weight: 800;
  color: #2d8a82;
}
.cd-mp-value {
  font-size: 11px;
  font-weight: 700;
  color: var(--cd-navy);
  word-break: break-word;
}
.cd-customer-card {
  border: 1px solid #dbe8ea;
  border-radius: 10px;
  background: linear-gradient(135deg, #f8fefc 0%, #ffffff 55%);
  padding: 10px 12px;
  margin-bottom: 12px;
  border-left: 5px solid var(--cd-accent);
  box-shadow: 0 2px 10px rgba(12, 39, 68, 0.06);
}
.cd-customer-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-weight: 800;
  font-size: 11px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(15, 118, 110, 0.25);
  color: var(--cd-navy);
}
.cd-customer-grid { display: grid; gap: 6px; }
.cd-cust-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: start; }
.cd-cust-cell { display: grid; gap: 3px; font-size: 10px; min-width: 0; }
.cd-cust-k { font-weight: 700; color: var(--cd-muted); font-size: 9px; text-transform: uppercase; letter-spacing: 0.03em; }
.cd-cust-v { font-weight: 600; word-break: break-word; overflow-wrap: anywhere; color: #132f47; }
.cd-lines-section { margin-bottom: 10px; }
.cd-table-scroll {
  width: 100%;
  max-width: 100%;
  overflow-x: visible;
  border-radius: 8px;
  border: 1px solid #c9dce4;
}
.cd-line-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: none;
  font-size: 9.5px;
}
.cd-line-table th, .cd-line-table td {
  border: 1px solid #b8ccd8;
  padding: 6px 5px;
  vertical-align: top;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.cd-line-table thead th {
  background: linear-gradient(180deg, var(--cd-navy-mid) 0%, var(--cd-navy) 100%);
  color: #f8fafc;
  font-weight: 800;
  border-color: #0a1f35;
}
.cd-th-en { display: block; font-size: 9px; letter-spacing: 0.02em; }
.cd-th-ar { display: block; font-size: 8px; margin-top: 2px; opacity: 0.92; font-weight: 600; }
.cd-th-seq { width: 28px; text-align: center; }
.cd-th-qty, .cd-th-price, .cd-th-disc, .cd-th-taxable, .cd-th-vatpct, .cd-th-vatamt { text-align: right; }
.cd-th-total { text-align: right; min-width: 76px; }
.cd-th-unit { width: 44px; text-align: center; }
.cd-line-table tbody tr:nth-child(even) { background: #f6fafb; }
.cd-td-seq { text-align: center; font-weight: 700; color: var(--cd-muted); }
.cd-td-price, .cd-td-disc, .cd-td-taxable, .cd-td-vatpct, .cd-td-vatamt, .cd-td-total {
  text-align: right;
  white-space: normal;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
  word-break: normal;
}
.cd-line-en { font-weight: 600; line-height: 1.35; color: #132f47; }
.cd-line-ar { font-size: 8.5px; color: #4a6678; margin-top: 3px; line-height: 1.35; }
.cd-totals-section { display: flex; justify-content: flex-end; margin: 12px 0 10px; }
.cd-totals-card {
  width: min(100%, 380px);
  border: 1px solid #bfd8e3;
  border-radius: 10px;
  background: #ffffff;
  padding: 10px 14px;
  border-left: 6px solid var(--cd-accent);
  box-shadow: 0 8px 22px rgba(12, 39, 68, 0.09);
}
.cd-total-line {
  display: grid;
  grid-template-columns: 1fr auto minmax(72px, min(40%, 200px));
  gap: 10px;
  align-items: baseline;
  padding: 5px 0;
  font-size: 10.5px;
}
.cd-total-labels { display: grid; gap: 2px; min-width: 0; }
.cd-tlbl-en { font-weight: 800; color: var(--cd-navy-mid); }
.cd-tlbl-ar { font-size: 9px; color: var(--cd-muted); font-weight: 600; }
.cd-total-currency { font-weight: 800; color: var(--cd-teal); text-align: right; min-width: 34px; }
.cd-total-amt {
  font-weight: 800;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-size: 11.5px;
  word-break: break-all;
  color: var(--cd-navy);
}
.cd-total-grand .cd-total-amt { font-size: 15px; font-weight: 900; color: var(--cd-navy); }
.cd-total-grand {
  border-top: 2px solid rgba(63, 174, 42, 0.35);
  margin-top: 6px;
  padding-top: 10px;
}
.cd-amount-words {
  margin-bottom: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px dashed #94c9bf;
  background: rgba(204, 251, 241, 0.35);
}
.cd-amount-words-head {
  font-size: 10px;
  font-weight: 800;
  color: var(--cd-teal);
  margin-bottom: 6px;
  letter-spacing: 0.03em;
}
.cd-amount-words-ar { font-size: 10px; font-weight: 700; color: var(--cd-navy-mid); margin-top: 4px; }
.cd-notes {
  border: 1px solid #dbe8ea;
  border-radius: 8px;
  padding: 8px 11px;
  margin-bottom: 10px;
  font-size: 10px;
  background: #ffffff;
}
.cd-notes-inner { white-space: pre-wrap; word-break: break-word; color: #1e3a50; }
.cd-zatca-card {
  margin-top: 8px;
  border: 2px solid var(--cd-teal);
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(15, 118, 110, 0.12);
}
.cd-zatca-card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: linear-gradient(90deg, var(--cd-navy) 0%, var(--cd-teal) 100%);
  color: #f8fafc;
  font-weight: 800;
  font-size: 10.5px;
  letter-spacing: 0.04em;
}
.cd-zatca-card-body {
  display: grid;
  grid-template-columns: 104px 1fr;
  gap: 12px;
  padding: 12px;
  align-items: start;
}
.cd-zatca-qr-img {
  width: 96px;
  height: 96px;
  border: 1px solid #bfe3df;
  border-radius: 6px;
  background: #fff;
  display: block;
}
.cd-zatca-fields { display: grid; gap: 6px; font-size: 9.5px; min-width: 0; }
.cd-zatca-row { display: grid; grid-template-columns: 136px 1fr; gap: 8px; align-items: start; }
.cd-zatca-k {
  font-weight: 800;
  color: var(--cd-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-size: 8.5px;
}
.cd-zatca-v { word-break: break-all; font-weight: 600; color: var(--cd-navy); }
.cd-zatca-mono { font-family: ui-monospace, Consolas, monospace; font-size: 8.5px; color: #0c2744; }
.cd-doc-footer {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid rgba(15, 118, 110, 0.28);
  font-size: 9px;
  text-align: center;
  color: var(--cd-muted);
}
.cd-doc-footer-ar { margin-top: 4px; font-weight: 600; color: #3d6d84; }
@media print {
  .cd-document-root {
    border: none;
    box-shadow: none;
    background: #fff;
    padding: 8mm 10mm;
  }
  .cd-table-scroll { overflow: visible; }
  .cd-line-table, .cd-totals-card, .cd-customer-card, .cd-zatca-card { break-inside: avoid; }
}
`;
