import type { ActivityEntry } from "@/lib/workspace-v2/types";

export const recentActivity: ActivityEntry[] = [
  {
    id: "act-001",
    at: "2026-04-22T11:42:00+03:00",
    actor: "Faisal Al-Otaibi",
    description: "Recorded payment PAY-2026-0312 against INV-2026-0218",
    target: "INV-2026-0218",
    kind: "payment",
  },
  {
    id: "act-002",
    at: "2026-04-21T15:08:00+03:00",
    actor: "Mariam Al-Saleh",
    description: "Issued invoice INV-2026-0218 to Riyadh Logistics Holding",
    target: "INV-2026-0218",
    kind: "create",
  },
  {
    id: "act-003",
    at: "2026-04-21T10:00:00+03:00",
    actor: "System",
    description: "Marked INV-2026-0217 as overdue",
    target: "INV-2026-0217",
    kind: "system",
  },
  {
    id: "act-004",
    at: "2026-04-20T17:24:00+03:00",
    actor: "Mariam Al-Saleh",
    description: "Sent quotation QTE-2026-0099 to Riyadh Logistics Holding",
    target: "QTE-2026-0099",
    kind: "send",
  },
  {
    id: "act-005",
    at: "2026-04-19T09:13:00+03:00",
    actor: "Khalid Al-Dossary",
    description: "Approved credit note CN-2026-0014 for INV-2026-0218",
    target: "CN-2026-0014",
    kind: "update",
  },
  {
    id: "act-006",
    at: "2026-04-18T13:50:00+03:00",
    actor: "System",
    description: "Stock alert: PV string inverter — 5kW reached out-of-stock",
    target: "INV-PV-5K",
    kind: "system",
  },
];
