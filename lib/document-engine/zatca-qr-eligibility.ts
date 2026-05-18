/**
 * Phase 1 TLV QR is for ZATCA simplified (B2C-style) invoices, not standard B2B tax invoices.
 * Credit/debit notes only show it when explicitly flagged as a simplified-note scenario.
 */

export type CustomFieldsMap = Record<string, string | number | boolean | null>;

function textFlag(value: unknown): string {
  if (typeof value === "string") return value.trim().toLowerCase();
  return "";
}

function boolFromCustom(custom: CustomFieldsMap, key: string, fallback = false): boolean {
  const raw = custom[key];
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no") return false;
  }
  if (typeof raw === "number") return raw !== 0;
  return fallback;
}

function isSimplifiedOrB2cTaxContext(custom: CustomFieldsMap): boolean {
  if (boolFromCustom(custom, "zatca_qr_required", false)) return true;
  const cat = textFlag(custom.zatca_invoice_category).replace(/\s+/g, "_") || textFlag(custom.invoice_category).replace(/\s+/g, "_");
  if (["simplified", "simplified_tax_invoice", "b2c", "consumer", "tax_simplified"].includes(cat)) return true;
  const rt = textFlag(custom.buyer_recipient_type) || textFlag(custom.recipient_type);
  if (["b2c", "consumer", "simplified"].includes(rt)) return true;
  return false;
}

/** True when the legacy preview renderer may embed a Phase 1 QR image (subject to template `show_qr`). */
export function complianceAllowsPhase1Qr(documentType: string, custom: CustomFieldsMap | null | undefined): boolean {
  const t = documentType.trim();
  const c = custom ?? {};
  if (t === "proforma_invoice" || t === "quotation" || t === "delivery_note" || t === "purchase_order") {
    return false;
  }
  if (t === "tax_invoice") {
    return isSimplifiedOrB2cTaxContext(c);
  }
  if (t === "credit_note" || t === "debit_note") {
    return boolFromCustom(c, "zatca_simplified_note_qr", false) || boolFromCustom(c, "zatca_show_simplified_qr", false);
  }
  return false;
}
