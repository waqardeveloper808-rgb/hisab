import type { DocumentRecord } from "@/lib/workspace-v2/types";

export const creditNotes: DocumentRecord[] = [
  {
    id: "cn-2026-0014",
    number: "CN-2026-0014",
    kind: "credit_note",
    customerId: "cust-001",
    issueDate: "2026-04-19",
    dueDate: "2026-04-19",
    status: "applied",
    currency: "SAR",
    subtotal: 1304.35,
    vat: 195.65,
    total: 1500,
    balance: 0,
    templateId: "tmpl-standard",
    notes: "Credit issued against INV-2026-0218 for partial cold chain refund.",
    lines: [
      { id: "ln-1", description: "Cold chain credit — partial reimbursement", quantity: 1, unitPrice: 1304.35, vatRate: 0.15 },
    ],
  },
  {
    id: "cn-2026-0013",
    number: "CN-2026-0013",
    kind: "credit_note",
    customerId: "cust-005",
    issueDate: "2026-04-13",
    dueDate: "2026-04-13",
    status: "issued",
    currency: "SAR",
    subtotal: 869.57,
    vat: 130.43,
    total: 1000,
    balance: 1000,
    templateId: "tmpl-modern",
    lines: [
      { id: "ln-1", description: "Workshop facilitation — credit", quantity: 1, unitPrice: 869.57, vatRate: 0.15 },
    ],
  },
];
