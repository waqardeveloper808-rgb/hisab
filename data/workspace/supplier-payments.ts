import type { SupplierPaymentRecord } from "@/lib/workspace/types";

export const supplierPayments: SupplierPaymentRecord[] = [
  {
    id: "spay-2026-0102",
    number: "SPAY-2026-0102",
    date: "2026-04-21",
    vendorId: "vend-001",
    billNumber: "BILL-2026-1188",
    amount: 18250,
    method: "bank_transfer",
    reference: "SABB-202604-21-11002",
    status: "cleared",
  },
  {
    id: "spay-2026-0101",
    number: "SPAY-2026-0101",
    date: "2026-04-19",
    vendorId: "vend-002",
    billNumber: "BILL-2026-1104",
    amount: 9400.75,
    method: "card",
    reference: "MADA-2026-04-19-4401",
    status: "cleared",
  },
  {
    id: "spay-2026-0100",
    number: "SPAY-2026-0100",
    date: "2026-04-16",
    vendorId: "vend-004",
    billNumber: "BILL-2026-1088",
    amount: 3200,
    method: "wallet",
    reference: "STC-OUT-202604-16-08",
    status: "pending",
  },
];
