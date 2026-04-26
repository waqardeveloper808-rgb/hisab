import previewDocuments from "@/data/preview-document-store.json";
import previewInventory from "@/data/preview-inventory-store.json";

type PreviewDoc = (typeof previewDocuments)[number];
type PreviewInv = (typeof previewInventory)[number];

export type TraceabilitySnapshot = {
  invoice_id?: string;
  invoice_label?: string;
  journal_id?: string;
  product_id?: string;
  vat_entry_id?: string;
  ledger_summary: string | null;
  has_document_ledger_lines: boolean;
  inventory_linked_to_document: boolean;
};

function firstTaxInvoicePosted(docs: PreviewDoc[]) {
  return docs.find((d) => d.type === "tax_invoice" && (d.status === "posted" || d.status === "sent" || d.status === "paid")) ?? docs[0];
}

function ledgerSummary(doc: PreviewDoc | undefined) {
  if (!doc?.lines?.length) return null;
  const codes = doc.lines
    .map((line) => line.ledger_account_id)
    .filter((id): id is number => id != null);
  return codes.length ? `ledger_lines=${codes.length};accounts=${[...new Set(codes)].slice(0, 4).join(",")}` : null;
}

export function collectTraceabilitySnapshot(): TraceabilitySnapshot {
  const docs = previewDocuments as PreviewDoc[];
  const inv = previewInventory as PreviewInv[];
  const primary = firstTaxInvoicePosted(docs);
  const invRow = inv.find((row) => row.document_links?.length && String(row.journal_entry_number ?? "").trim().length > 0) ?? inv[0];
  const linkedDoc = invRow?.document_links?.[0];

  const invoiceId = primary ? String(primary.id) : linkedDoc ? String(linkedDoc.documentId) : undefined;
  const invoiceLabel = primary?.document_number ?? linkedDoc?.documentNumber;
  const journalId = invRow?.journal_entry_number ? String(invRow.journal_entry_number) : undefined;
  const productId = invRow?.item_id != null ? String(invRow.item_id) : undefined;
  const vatLineSample = primary?.lines?.find((line) => {
    const cf = line.metadata && typeof line.metadata === "object" && "custom_fields" in line.metadata
      ? (line.metadata as { custom_fields?: { vat_rate?: number } }).custom_fields
      : undefined;
    const taxAmt = "tax_amount" in line ? (line as { tax_amount?: number }).tax_amount : undefined;
    return cf?.vat_rate != null || (taxAmt ?? 0) > 0;
  });
  const vatEntryId =
    primary?.id != null && vatLineSample
      ? `VAT-LINE-${primary.id}-${vatLineSample.id ?? "0"}`
      : primary?.tax_total != null
        ? `VAT-SUM-${primary.id}`
        : undefined;

  return {
    invoice_id: invoiceId,
    invoice_label: invoiceLabel,
    journal_id: journalId,
    product_id: productId,
    vat_entry_id: vatEntryId,
    ledger_summary: ledgerSummary(primary),
    has_document_ledger_lines: Boolean(ledgerSummary(primary)),
    inventory_linked_to_document: Boolean(invRow?.document_links?.length),
  };
}
