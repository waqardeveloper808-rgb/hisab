import { describe, expect, it } from "vitest";
import { buildInventoryIntelligence, buildReportIntelligence, buildTransactionIntelligence } from "@/lib/intelligence-layer";

describe("intelligence-layer", () => {
  it("flags missing contact and due date anomalies", () => {
    const result = buildTransactionIntelligence({
      lines: [{ id: "1", itemId: null, description: "Consulting", quantity: 1, price: 5000, customFields: {} }],
      selectedContact: null,
      contacts: [],
      items: [],
      issueDate: "2026-04-20",
      dueDate: "2026-04-19",
      paymentAmount: 0,
    });

    expect(result.anomalies.some((item) => item.message.includes("No customer or supplier"))).toBe(true);
    expect(result.anomalies.some((item) => item.message.includes("Due date precedes issue date"))).toBe(true);
    expect(result.confidenceScore).toBeLessThan(50);
  });

  it("detects inventory shortage risk", () => {
    const result = buildInventoryIntelligence({ itemName: "Widget", available: 1, requested: 3, reorderLevel: 2, averageUsage: 1.5 });
    expect(result.anomalies[0]?.severity).toBe("critical");
    expect(result.reminders[0]?.label).toContain("Reorder");
  });

  it("generates reporting reminders for large receivables", () => {
    const result = buildReportIntelligence({ netProfit: 1000, receivablesTotal: 30000, payablesTotal: 5000, vatBalance: 12000 });
    expect(result.reminders.some((item) => item.label.includes("Receivables"))).toBe(true);
    expect(result.reminders.some((item) => item.label.includes("VAT"))).toBe(true);
  });
});