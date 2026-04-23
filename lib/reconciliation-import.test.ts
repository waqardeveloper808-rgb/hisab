import { describe, expect, it } from "vitest";
import {
  analyzeMapping,
  buildDraftPreview,
  buildSuggestedMapping,
  parseImportTable,
} from "@/lib/reconciliation-import";

describe("reconciliation import analysis", () => {
  it("accepts a good file with valid rows", () => {
    const table = parseImportTable([
      "transaction_date,reference,description,debit,credit,running_balance",
      "2026-04-18,DEP-1001,Customer receipt,0,1250,1250",
      "2026-04-19,CHQ-2001,Supplier payment,420,0,830",
    ].join("\n"));

    const mapping = buildSuggestedMapping(table.headers);
    const preview = buildDraftPreview(table, mapping);

    expect(preview.lines).toHaveLength(2);
    expect(preview.issues.filter((issue) => issue.severity === "error")).toHaveLength(0);
  });

  it("maps contact style headers into the transaction import model", () => {
    const table = parseImportTable([
      "document_date,supplier_name,document_number,receipt_number",
      "2026-04-18,Alpha Gulf,INV-1001,RCPT-9001",
    ].join("\n"));

    const mapping = buildSuggestedMapping(table.headers);

    expect(mapping.transactionDate).toBe("document_date");
    expect(mapping.customer).toBe("supplier_name");
    expect(mapping.reference).toBe("document_number");
    expect(mapping.paymentReference).toBe("receipt_number");
  });

  it("detects missing required columns", () => {
    const table = parseImportTable([
      "reference,description,amount",
      "DEP-1001,Customer receipt,1250",
    ].join("\n"));

    const mapping = buildSuggestedMapping(table.headers);
    const analysis = analyzeMapping(table.headers, mapping);

    expect(analysis.missingRequiredTargets).toContain("transactionDate");
  });

  it("flags wrong date and amount formats clearly", () => {
    const table = parseImportTable([
      "transaction_date,reference,amount",
      "18-99-2026,DEP-1001,abc",
    ].join("\n"));

    const mapping = buildSuggestedMapping(table.headers);
    const preview = buildDraftPreview(table, mapping);

    expect(preview.lines).toHaveLength(0);
    expect(preview.issues.some((issue) => issue.message.includes("unsupported format") || issue.message.includes("Amount formatting is invalid"))).toBe(true);
  });

  it("warns about duplicate and existing references", () => {
    const table = parseImportTable([
      "transaction_date,reference,amount",
      "2026-04-18,DEP-1001,1250",
      "2026-04-19,DEP-1001,900",
    ].join("\n"));

    const mapping = buildSuggestedMapping(table.headers);
    const preview = buildDraftPreview(table, mapping, { existingReferences: ["DEP-1001"] });

    expect(preview.issues.filter((issue) => issue.severity === "warning").length).toBeGreaterThanOrEqual(2);
  });

  it("handles mixed valid and invalid rows", () => {
    const table = parseImportTable([
      "transaction_date,reference,amount",
      "2026-04-18,DEP-1001,1250",
      ",DEP-1002,500",
      "2026-04-20,DEP-1003,0",
    ].join("\n"));

    const mapping = buildSuggestedMapping(table.headers);
    const preview = buildDraftPreview(table, mapping);

    expect(preview.lines).toHaveLength(1);
    expect(preview.issues.filter((issue) => issue.severity === "error")).toHaveLength(2);
  });

  it("parses pasted tabular data with tabs", () => {
    const table = parseImportTable([
      "date\treference\tdescription\tamount",
      "18/04/2026\tDEP-1001\tCustomer receipt\t1250",
    ].join("\n"));

    const mapping = buildSuggestedMapping(table.headers);
    const preview = buildDraftPreview(table, mapping);

    expect(table.delimiter).toBe("\t");
    expect(preview.lines[0]?.transactionDate).toBe("2026-04-18");
    expect(preview.lines[0]?.credit).toBe(1250);
  });
});
