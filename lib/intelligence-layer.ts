import type { ContactRecord, ItemRecord, TransactionLine } from "@/components/workflow/types";

export type IntelligenceSuggestion = {
  label: string;
  reason: string;
  confidence: number;
};

export type IntelligenceAnomaly = {
  severity: "info" | "warning" | "critical";
  message: string;
  confidence: number;
};

export type IntelligenceReminder = {
  label: string;
  reason: string;
  priority: "low" | "medium" | "high";
};

export type IntelligenceOutcome = {
  suggestions: IntelligenceSuggestion[];
  anomalies: IntelligenceAnomaly[];
  reminders: IntelligenceReminder[];
  confidenceScore: number;
};

function roundConfidence(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildTransactionIntelligence(input: {
  lines: TransactionLine[];
  selectedContact: ContactRecord | null;
  contacts: ContactRecord[];
  items: ItemRecord[];
  issueDate: string;
  dueDate: string;
  paymentAmount?: number;
}) : IntelligenceOutcome {
  const suggestions: IntelligenceSuggestion[] = [];
  const anomalies: IntelligenceAnomaly[] = [];
  const reminders: IntelligenceReminder[] = [];

  const populatedLines = input.lines.filter((line) => line.description.trim() || line.itemId || line.backendItemId);
  const lineTotal = populatedLines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
  const customerPatternCount = input.selectedContact
    ? input.contacts.filter((contact) => contact.city === input.selectedContact?.city && contact.kind === input.selectedContact.kind).length
    : 0;

  if (input.selectedContact?.defaultTax) {
    suggestions.push({
      label: `Use ${input.selectedContact.defaultTax}`,
      reason: "Customer profile already carries a preferred tax treatment.",
      confidence: 88,
    });
  }

  const productMatches = populatedLines
    .map((line) => input.items.find((item) => item.id === line.itemId || item.backendId === line.backendItemId))
    .filter((item): item is ItemRecord => Boolean(item));

  if (productMatches.length > 0) {
    const topMatch = productMatches[0];
    suggestions.push({
      label: `Reuse ${topMatch.name} defaults`,
      reason: "Selected item history can fill tax, SKU, and commercial defaults consistently.",
      confidence: 84,
    });
  }

  if (customerPatternCount >= 2 && input.selectedContact) {
    suggestions.push({
      label: `Match ${input.selectedContact.city} customer pattern`,
      reason: "Similar customer records suggest recurring commercial settings in the same region.",
      confidence: 72,
    });
  }

  const seenDescriptions = new Set<string>();
  populatedLines.forEach((line) => {
    const normalized = line.description.trim().toLowerCase();
    if (normalized && seenDescriptions.has(normalized)) {
      anomalies.push({
        severity: "warning",
        message: `Duplicate line description detected: ${line.description}`,
        confidence: 81,
      });
    }
    if (normalized) {
      seenDescriptions.add(normalized);
    }

    if (line.price > 0 && line.quantity > 0 && (line.price * line.quantity) > 50000) {
      anomalies.push({
        severity: "warning",
        message: `Unusually high line value detected for ${line.description || "unnamed line"}.`,
        confidence: 77,
      });
    }
  });

  if (!input.selectedContact) {
    anomalies.push({
      severity: "critical",
      message: "No customer or supplier is selected.",
      confidence: 96,
    });
  }

  if (input.dueDate < input.issueDate) {
    anomalies.push({
      severity: "critical",
      message: "Due date precedes issue date.",
      confidence: 99,
    });
  }

  if ((input.paymentAmount ?? 0) === 0 && lineTotal > 0) {
    reminders.push({
      label: "Unpaid invoice follow-up",
      reason: "No payment amount is recorded for a commercial document with value.",
      priority: lineTotal > 5000 ? "high" : "medium",
    });
  }

  if (populatedLines.some((line) => (line.customFields.stock_on_hand as number | undefined) === 0)) {
    reminders.push({
      label: "Low stock review",
      reason: "At least one selected item indicates zero stock on hand.",
      priority: "high",
    });
  }

  const confidenceScore = roundConfidence(
    62
      + (input.selectedContact ? 12 : -18)
      + (populatedLines.length > 0 ? 10 : -12)
      + (suggestions.length * 4)
      - (anomalies.filter((item) => item.severity === "critical").length * 18)
      - (anomalies.filter((item) => item.severity === "warning").length * 7)
  );

  return { suggestions, anomalies, reminders, confidenceScore };
}

export function buildInventoryIntelligence(input: {
  itemName: string;
  available: number;
  requested: number;
  reorderLevel?: number;
  averageUsage?: number;
}): IntelligenceOutcome {
  const suggestions: IntelligenceSuggestion[] = [];
  const anomalies: IntelligenceAnomaly[] = [];
  const reminders: IntelligenceReminder[] = [];

  if (input.available < input.requested) {
    anomalies.push({
      severity: "critical",
      message: `${input.itemName} requested quantity exceeds stock on hand.`,
      confidence: 98,
    });
  }

  if (typeof input.reorderLevel === "number" && input.available <= input.reorderLevel) {
    reminders.push({
      label: `Reorder ${input.itemName}`,
      reason: "Stock has reached or fallen below reorder level.",
      priority: "high",
    });
  }

  if (typeof input.averageUsage === "number" && input.averageUsage > 0 && input.available < input.averageUsage * 2) {
    suggestions.push({
      label: "Increase safety stock",
      reason: "Current quantity is less than two cycles of average usage.",
      confidence: 74,
    });
  }

  return {
    suggestions,
    anomalies,
    reminders,
    confidenceScore: roundConfidence(80 - (anomalies.length * 18) + (suggestions.length * 5)),
  };
}

export function buildReportIntelligence(input: {
  netProfit: number;
  receivablesTotal: number;
  payablesTotal: number;
  vatBalance: number;
}): IntelligenceOutcome {
  const suggestions: IntelligenceSuggestion[] = [];
  const anomalies: IntelligenceAnomaly[] = [];
  const reminders: IntelligenceReminder[] = [];

  if (input.receivablesTotal > input.payablesTotal * 2 && input.receivablesTotal > 0) {
    reminders.push({
      label: "Receivables collection focus",
      reason: "Receivables materially exceed payables and may pressure liquidity.",
      priority: "high",
    });
  }

  if (input.netProfit < 0) {
    anomalies.push({
      severity: "warning",
      message: "Current period is operating at a loss.",
      confidence: 90,
    });
  } else {
    suggestions.push({
      label: "Protect margin drivers",
      reason: "Positive net profit suggests focusing on the highest-performing categories and customers.",
      confidence: 69,
    });
  }

  if (Math.abs(input.vatBalance) > 10000) {
    reminders.push({
      label: "Review VAT drill-down",
      reason: "VAT balance is large enough to warrant source-document review before filing.",
      priority: "medium",
    });
  }

  return {
    suggestions,
    anomalies,
    reminders,
    confidenceScore: roundConfidence(78 - (anomalies.length * 12) + (suggestions.length * 5)),
  };
}