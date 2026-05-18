import type { DocumentRenderModel } from "@/lib/document-engine/types";
import { encodePhase1TlvBase64, normalizePhase1Money } from "@/lib/workspace/exports/zatca-phase1-tlv";

function text(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const v = value.trim();
    return v.length ? v : fallback;
  }
  return fallback;
}

function timestampIsoUtc(issueDate: string): string {
  try {
    return new Date(issueDate.includes("T") ? issueDate : `${issueDate}T12:00:00`)
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z");
  } catch {
    return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  }
}

/** ZATCA simplified-invoice TLV as base64 (Phase 1 cryptographic fields are not embedded here — see qr.ts / enrich). */
export function buildZatcaQrPayload(model: DocumentRenderModel): string {
  const seller = text(model.company.englishName || model.company.tradeName || model.company.legalName, "");
  const vat = text(model.company.vatNumber, "");
  const iso = timestampIsoUtc(model.invoice.issueDate);
  const total = normalizePhase1Money(model.invoice.grandTotal);
  const vatTotal = normalizePhase1Money(model.invoice.vatTotal);
  return encodePhase1TlvBase64({
    sellerName: seller,
    vatNumber: vat,
    timestampIsoUtc: iso,
    invoiceTotal: total,
    vatAmount: vatTotal,
  });
}
