import type { SystemMonitorLinkedEntities } from "@/lib/audit-engine/monitor-types";
import type { TraceabilitySnapshot } from "@/lib/audit-engine/evidence-entities";

export function buildAccountingTrace(snapshot: TraceabilitySnapshot): string[] {
  const steps: string[] = [];
  if (snapshot.invoice_label) {
    steps.push(`Invoice → ${snapshot.invoice_label}${snapshot.invoice_id ? ` (id=${snapshot.invoice_id})` : ""}`);
  } else {
    steps.push("Invoice → (no sample invoice reference in preview store)");
  }
  if (snapshot.journal_id) {
    steps.push(`Journal Entry → ${snapshot.journal_id}`);
  } else {
    steps.push("Journal Entry → NOT RESOLVED (no journal reference in sampled inventory evidence)");
  }
  if (snapshot.ledger_summary) {
    steps.push(`Ledger impact → ${snapshot.ledger_summary}`);
  } else {
    steps.push("Ledger impact → NOT RESOLVED (no ledger line sample)");
  }
  return steps;
}

export function buildInventoryTrace(snapshot: TraceabilitySnapshot): string[] {
  const steps: string[] = [];
  if (snapshot.invoice_label) {
    steps.push(`Invoice → ${snapshot.invoice_label}`);
  } else {
    steps.push("Invoice → (no linked document label in inventory sample)");
  }
  steps.push(`Stock evidence → inventory store rows with document_links=${snapshot.inventory_linked_to_document ? "yes" : "no"}`);
  if (snapshot.journal_id) {
    steps.push(`COGS / movement journal → ${snapshot.journal_id}`);
  } else {
    steps.push("COGS / movement journal → NOT RESOLVED");
  }
  return steps;
}

export function buildVatTrace(snapshot: TraceabilitySnapshot): string[] {
  const steps: string[] = [];
  if (snapshot.invoice_label) {
    steps.push(`Invoice → ${snapshot.invoice_label}`);
  } else {
    steps.push("Invoice → (no taxable document sample)");
  }
  if (snapshot.vat_entry_id) {
    steps.push(`VAT line / summary → ${snapshot.vat_entry_id}`);
  } else {
    steps.push("VAT line / summary → NOT RESOLVED");
  }
  return steps;
}

export function linkedEntitiesForDomain(
  domain: "accounting" | "vat" | "inventory" | "other",
  snapshot: TraceabilitySnapshot,
): SystemMonitorLinkedEntities {
  const base: SystemMonitorLinkedEntities = {};
  if (snapshot.invoice_id) base.invoice_id = snapshot.invoice_id;
  if (snapshot.journal_id) base.journal_id = snapshot.journal_id;
  if (snapshot.product_id) base.product_id = snapshot.product_id;
  if (snapshot.vat_entry_id) base.vat_entry_id = snapshot.vat_entry_id;

  if (domain === "accounting") {
    return { invoice_id: base.invoice_id, journal_id: base.journal_id };
  }
  if (domain === "vat") {
    return { invoice_id: base.invoice_id, vat_entry_id: base.vat_entry_id };
  }
  if (domain === "inventory") {
    return { invoice_id: base.invoice_id, journal_id: base.journal_id, product_id: base.product_id };
  }
  return base;
}

export function domainLinkMissing(
  domain: "accounting" | "vat" | "inventory" | "other",
  snapshot: TraceabilitySnapshot,
): boolean {
  if (domain === "accounting") {
    return !snapshot.journal_id || !snapshot.has_document_ledger_lines;
  }
  if (domain === "vat") {
    return !snapshot.vat_entry_id;
  }
  if (domain === "inventory") {
    return !snapshot.inventory_linked_to_document || !snapshot.journal_id;
  }
  return false;
}
