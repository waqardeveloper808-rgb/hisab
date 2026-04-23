export type AiAction = {
  type: "block" | "warn" | "suggest";
  field: string;
  message: string;
};

export function vatGuard(vatNumber: string, field = "vatNumber"): AiAction[] {
  const digits = vatNumber.replace(/\D+/g, "");
  if (!digits) {
    return [];
  }

  if (!/^3\d{13}3$/.test(digits)) {
    return [{
      type: "block",
      field,
      message: "Invalid VAT number detected. Saving is blocked until the VAT number is a valid 15-digit Saudi VAT number.",
    }];
  }

  return [];
}

export function transactionAnomalyWarning(total: number, threshold = 100000): AiAction[] {
  if (total > threshold) {
    return [{
      type: "warn",
      field: "grandTotal",
      message: `Transaction total ${total.toFixed(2)} exceeds the normal range threshold ${threshold.toFixed(2)} and should be reviewed before posting.`,
    }];
  }

  return [];
}

export function journalImbalanceSuggestion(journalId: number, debit: number, credit: number): AiAction {
  return {
    type: "suggest",
    field: `journal:${journalId}`,
    message: `Journal ${journalId} is short by ${Math.abs(debit - credit).toFixed(2)}. Add the missing offsetting line before closure.`,
  };
}