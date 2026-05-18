import type { CurrencyCode, DocumentKind, DocumentLine, DocumentRecord, DocumentStatus } from "@/lib/workspace/types";

export type WorkflowRegisterDocumentSlice = {
  id: number;
  type: string;
  status: string;
  number: string;
  issueDate: string;
  dueDate: string;
  grandTotal: number;
  balanceDue: number;
  taxableTotal: number;
  taxTotal: number;
  contactName: string;
};

function mapBackendDocumentStatus(raw: string): DocumentStatus {
  const s = (raw ?? "").trim().toLowerCase();
  const table: Record<string, DocumentStatus> = {
    draft: "draft",
    finalized: "issued",
    issued: "issued",
    sent: "sent",
    viewed: "viewed",
    partially_paid: "partially_paid",
    paid: "paid",
    void: "void",
    credited: "paid",
    partially_credited: "partially_paid",
    credit_owed: "partially_paid",
    reported: "issued",
    accepted: "accepted",
    rejected: "rejected",
    expired: "expired",
  };
  return table[s] ?? "pending";
}

function fallbackLinesFromTotals(row: WorkflowRegisterDocumentSlice): DocumentLine[] {
  const taxable = Number.isFinite(row.taxableTotal) ? row.taxableTotal : Math.max(row.grandTotal - row.taxTotal, 0);
  const vatRate = taxable > 1e-6 ? Math.round((10000 * row.taxTotal) / taxable) / 10000 : 0;
  return [
    {
      id: `ln-${row.id}`,
      description: `${row.number} (${row.type})`,
      quantity: 1,
      unitPrice: taxable,
      vatRate,
    },
  ];
}

export function workspaceDocumentToSalesRegisterRecord(row: WorkflowRegisterDocumentSlice, registerKind: DocumentKind): DocumentRecord {
  const taxable = Number.isFinite(row.taxableTotal) ? row.taxableTotal : Math.max(row.grandTotal - row.taxTotal, 0);
  return {
    id: String(row.id),
    number: row.number || `Draft-${row.id}`,
    kind: registerKind,
    customerId: "__live__",
    issueDate: row.issueDate ?? "",
    dueDate: row.dueDate ?? row.issueDate ?? "",
    status: mapBackendDocumentStatus(row.status),
    currency: "SAR" as CurrencyCode,
    subtotal: taxable,
    vat: row.taxTotal ?? 0,
    total: row.grandTotal ?? 0,
    balance: row.balanceDue ?? row.grandTotal ?? 0,
    lines: fallbackLinesFromTotals(row),
    notes: undefined,
    templateId: undefined,
    partyDisplayName: row.contactName?.trim() ? row.contactName : undefined,
    partySecondaryLine: row.type.replaceAll("_", " "),
    supportsLocalTemplateExport: false,
  };
}
