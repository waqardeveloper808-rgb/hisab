import type { DocumentRenderModel } from "@/lib/document-engine/types";
import { encodePhase1TlvBase64, normalizePhase1Money } from "@/lib/workspace/exports/zatca-phase1-tlv";
import { buildPhase1Qr } from "@/lib/workspace/exports/qr";

function issueTimestampIsoUtc(issueDate: string): string {
  try {
    return new Date(issueDate.includes("T") ? issueDate : `${issueDate}T12:00:00`).toISOString().replace(/\.\d{3}Z$/, "Z");
  } catch {
    return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  }
}

/** Attach TLV base64 + local QR raster (data URL) for compact renders when Phase 1 QR is enabled (simplified tax / flagged notes). */
export async function enrichTaxInvoiceCompactWithPhase1Qr(
  model: DocumentRenderModel,
): Promise<DocumentRenderModel> {
  if (!model.zatca?.enabled || !["tax_invoice", "credit_note", "debit_note"].includes(model.document.kind)) {
    return model;
  }

  const seller =
    model.company.englishName ||
    model.company.tradeName ||
    model.company.legalName ||
    "";
  const vatNum = model.company.vatNumber || "";
  const ts = issueTimestampIsoUtc(model.invoice.issueDate);
  const total = normalizePhase1Money(model.invoice.grandTotal);
  const vat = normalizePhase1Money(model.invoice.vatTotal);

  const tlvBase64 = encodePhase1TlvBase64({
    sellerName: seller,
    vatNumber: vatNum,
    timestampIsoUtc: ts,
    invoiceTotal: total,
    vatAmount: vat,
  });

  const phase1 = await buildPhase1Qr({
    sellerName: seller,
    vatNumber: vatNum,
    timestamp: ts,
    invoiceTotal: Number(model.invoice.grandTotal),
    vatAmount: Number(model.invoice.vatTotal),
  });

  const nextZ = {
    ...model.zatca,
    qrPayload: tlvBase64,
    qrImageDataUrl: phase1.imageDataUrl,
  };

  return { ...model, zatca: nextZ };
}
