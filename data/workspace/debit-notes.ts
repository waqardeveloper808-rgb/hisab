import type { DocumentRecord } from "@/lib/workspace/types";

export const debitNotes: DocumentRecord[] = [
  {
    id: "dn-2026-0007",
    number: "DN-2026-0007",
    kind: "debit_note",
    customerId: "cust-002",
    issueDate: "2026-04-18",
    dueDate: "2026-04-25",
    status: "issued",
    currency: "SAR",
    subtotal: 695.65,
    vat: 104.35,
    total: 800,
    balance: 800,
    templateId: "tmpl-standard",
    notes: "Debit note for additional commissioning hours on INV-2026-0217.",
    lines: [
      { id: "ln-1", description: "Additional commissioning — 2 hours", quantity: 2, unitPrice: 347.83, vatRate: 0.15 },
    ],
  },
  {
    id: "dn-2026-0006",
    number: "DN-2026-0006",
    kind: "debit_note",
    customerId: "cust-007",
    issueDate: "2026-04-08",
    dueDate: "2026-04-15",
    status: "applied",
    currency: "SAR",
    subtotal: 217.39,
    vat: 32.61,
    total: 250,
    balance: 0,
    templateId: "tmpl-standard",
    lines: [
      { id: "ln-1", description: "Bench-test material adjustment", quantity: 1, unitPrice: 217.39, vatRate: 0.15 },
    ],
  },
];
