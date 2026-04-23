export type ImportField =
  | "transactionDate"
  | "valueDate"
  | "reference"
  | "invoiceNumber"
  | "paymentReference"
  | "description"
  | "customer"
  | "company"
  | "debit"
  | "credit"
  | "amount"
  | "subtotal"
  | "vat"
  | "currency"
  | "quantity"
  | "itemDescription"
  | "runningBalance"
  | "accountCategory";

export type ParsedImportTable = {
  headers: string[];
  rows: string[][];
  delimiter: string;
};

export type MappingAnalysis = {
  duplicateTargets: ImportField[];
  missingRequiredTargets: ImportField[];
  unmappedSourceHeaders: string[];
  mappedSourceHeaders: string[];
};

export type DraftIssueSeverity = "error" | "warning";

export type DraftIssue = {
  rowNumber: number;
  message: string;
  severity: DraftIssueSeverity;
};

export type StatementImportLineInput = {
  transactionDate: string;
  valueDate?: string;
  reference?: string;
  description?: string;
  debit?: number;
  credit?: number;
  runningBalance?: number;
};

export type ImportExecutionSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedRows: number;
  skippedRows: number;
  failedRows: number;
  generatedRecords: string[];
  warnings: string[];
  errors: string[];
};

const importFieldLabels: Record<ImportField, string> = {
  transactionDate: "Transaction date",
  valueDate: "Value date",
  reference: "Reference",
  invoiceNumber: "Invoice number",
  paymentReference: "Payment reference",
  description: "Description",
  customer: "Customer or contact",
  company: "Company",
  debit: "Debit",
  credit: "Credit",
  amount: "Amount",
  subtotal: "Subtotal",
  vat: "VAT",
  currency: "Currency",
  quantity: "Quantity",
  itemDescription: "Item or description",
  runningBalance: "Running balance",
  accountCategory: "Account or category",
};

const REQUIRED_TARGETS: ImportField[] = ["transactionDate"];

export function normalizeFieldLabel(field: ImportField) {
  return importFieldLabels[field];
}

export function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function parseDelimitedRow(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function parseImportTable(source: string): ParsedImportTable {
  const rows = source
    .split(/\r?\n/)
    .map((line) => line.replace(/\r/g, ""))
    .filter((line) => line.trim().length > 0);

  if (rows.length < 2) {
    return { headers: [], rows: [], delimiter: "," };
  }

  const candidates = ["\t", ";", ",", "|"];
  const delimiter = candidates
    .map((candidate) => ({ candidate, count: rows[0].split(candidate).length }))
    .sort((left, right) => right.count - left.count)[0]?.candidate ?? ",";

  return {
    delimiter,
    headers: parseDelimitedRow(rows[0], delimiter),
    rows: rows.slice(1).map((row) => parseDelimitedRow(row, delimiter)),
  };
}

export function suggestFieldFromHeader(header: string): ImportField | null {
  const normalized = normalizeHeader(header);

  if (["transaction_date", "date", "posting_date", "statement_date", "document_date", "transaction_on"].includes(normalized)) return "transactionDate";
  if (["value_date", "settlement_date", "value_on"].includes(normalized)) return "valueDate";
  if (["reference", "ref", "document_number", "document_no", "statement_reference", "voucher_number", "voucher_no"].includes(normalized)) return "reference";
  if (["invoice_number", "invoice_no", "bill_number", "bill_no"].includes(normalized)) return "invoiceNumber";
  if (["payment_reference", "payment_ref", "receipt_reference", "receipt_no", "receipt_number", "transaction_reference"].includes(normalized)) return "paymentReference";
  if (["description", "memo", "details", "narration", "note", "particulars", "remarks"].includes(normalized)) return "description";
  if (["customer", "customer_name", "contact", "contact_name", "contact_full_name", "full_name", "party", "counterparty", "supplier", "supplier_name", "vendor", "vendor_name", "legal_name"].includes(normalized)) return "customer";
  if (["company", "company_name", "business_name", "legal_entity", "entity_name"].includes(normalized)) return "company";
  if (["debit", "withdrawal", "outflow", "money_out"].includes(normalized)) return "debit";
  if (["credit", "deposit", "inflow", "money_in"].includes(normalized)) return "credit";
  if (["amount", "net_amount", "transaction_amount", "gross_amount"].includes(normalized)) return "amount";
  if (["subtotal", "taxable_amount", "before_tax"].includes(normalized)) return "subtotal";
  if (["vat", "vat_amount", "tax", "tax_amount"].includes(normalized)) return "vat";
  if (["currency", "currency_code"].includes(normalized)) return "currency";
  if (["quantity", "qty"].includes(normalized)) return "quantity";
  if (["item", "product", "product_name", "item_description", "line_description"].includes(normalized)) return "itemDescription";
  if (["running_balance", "balance", "closing_balance"].includes(normalized)) return "runningBalance";
  if (["account", "account_name", "category", "ledger_account"].includes(normalized)) return "accountCategory";

  return null;
}

export function buildSuggestedMapping(headers: string[]): Record<ImportField, string> {
  const initial = Object.keys(importFieldLabels).reduce<Record<ImportField, string>>((mapping, key) => {
    mapping[key as ImportField] = "";
    return mapping;
  }, {} as Record<ImportField, string>);

  for (const header of headers) {
    const field = suggestFieldFromHeader(header);
    if (field && !initial[field]) {
      initial[field] = header;
    }
  }

  return initial;
}

export function analyzeMapping(headers: string[], mapping: Record<ImportField, string>): MappingAnalysis {
  const sourceUsage = new Map<string, ImportField[]>();
  Object.entries(mapping).forEach(([field, header]) => {
    if (!header) {
      return;
    }

    const current = sourceUsage.get(header) ?? [];
    current.push(field as ImportField);
    sourceUsage.set(header, current);
  });

  const duplicateTargets = [...sourceUsage.values()]
    .filter((fields) => fields.length > 1)
    .flat();

  const missingRequiredTargets = REQUIRED_TARGETS.filter((field) => !mapping[field]);
  const mappedSourceHeaders = [...sourceUsage.keys()];
  const unmappedSourceHeaders = headers.filter((header) => !sourceUsage.has(header));

  return {
    duplicateTargets,
    missingRequiredTargets,
    unmappedSourceHeaders,
    mappedSourceHeaders,
  };
}

function parseNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function normalizeDate(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, day, month, year] = slash;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

export function buildDraftPreview(
  table: ParsedImportTable,
  mapping: Record<ImportField, string>,
  options?: { existingReferences?: string[] },
) {
  const headerIndex = new Map(table.headers.map((header, index) => [header, index]));
  const issues: DraftIssue[] = [];
  const lines: StatementImportLineInput[] = [];
  const warnings = new Set<string>();
  const seenReferences = new Set<string>();
  const existingReferences = new Set((options?.existingReferences ?? []).filter(Boolean).map((value) => value.trim().toLowerCase()));

  const readCell = (row: string[], field: ImportField) => {
    const header = mapping[field];
    const index = header ? headerIndex.get(header) : undefined;
    return index === undefined ? "" : (row[index] ?? "").trim();
  };

  if (!mapping.transactionDate) {
    issues.push({ rowNumber: 1, severity: "error", message: "Map a transaction date column before previewing the import." });
    return { lines, issues, warnings: [...warnings] };
  }

  if (!mapping.amount && !mapping.debit && !mapping.credit) {
    issues.push({ rowNumber: 1, severity: "error", message: "Map an amount column or separate debit and credit columns before previewing the import." });
    return { lines, issues, warnings: [...warnings] };
  }

  table.rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const transactionDate = normalizeDate(readCell(row, "transactionDate"));
    const valueDate = normalizeDate(readCell(row, "valueDate"));
    const reference = readCell(row, "reference") || readCell(row, "invoiceNumber") || readCell(row, "paymentReference");
    const description = readCell(row, "description") || readCell(row, "itemDescription") || readCell(row, "customer") || readCell(row, "company");
    const debit = parseNumber(readCell(row, "debit"));
    const credit = parseNumber(readCell(row, "credit"));
    const amount = parseNumber(readCell(row, "amount"));
    const subtotal = parseNumber(readCell(row, "subtotal"));
    const vat = parseNumber(readCell(row, "vat"));
    const runningBalance = parseNumber(readCell(row, "runningBalance"));

    if (row.every((cell) => !cell.trim())) {
      issues.push({ rowNumber, severity: "error", message: "Critical row is empty and cannot be imported." });
      return;
    }

    if (!transactionDate) {
      issues.push({ rowNumber, severity: "error", message: "Transaction date is missing or uses an unsupported format." });
      return;
    }

    let nextDebit = Number.isFinite(debit as number) ? (debit as number) : 0;
    let nextCredit = Number.isFinite(credit as number) ? (credit as number) : 0;

    if (!nextDebit && !nextCredit && Number.isFinite(amount as number) && amount !== null && amount !== 0) {
      if ((amount as number) < 0) {
        nextDebit = Math.abs(amount as number);
      } else {
        nextCredit = amount as number;
      }
    }

    if ((debit !== null && Number.isNaN(debit)) || (credit !== null && Number.isNaN(credit)) || (amount !== null && Number.isNaN(amount))) {
      issues.push({ rowNumber, severity: "error", message: "Amount formatting is invalid. Use plain numeric values such as 1250.50." });
      return;
    }

    if (vat !== null && (Number.isNaN(vat) || vat < 0)) {
      issues.push({ rowNumber, severity: "error", message: "VAT value is invalid. Use a zero or positive numeric tax amount." });
      return;
    }

    if (subtotal !== null && Number.isFinite(subtotal) && vat !== null && Number.isFinite(vat) && vat > Math.abs(subtotal) * 0.5) {
      issues.push({ rowNumber, severity: "warning", message: "VAT amount looks unusually high compared with the subtotal." });
    }

    if (nextDebit < 0 || nextCredit < 0) {
      issues.push({ rowNumber, severity: "error", message: "Debit and credit must not be negative after normalization." });
      return;
    }

    if (nextDebit > 0 && nextCredit > 0) {
      issues.push({ rowNumber, severity: "warning", message: "Both debit and credit are populated. Review whether this row should be split before import." });
    }

    if (!nextDebit && !nextCredit) {
      issues.push({ rowNumber, severity: "error", message: "Row needs a debit, credit, or amount value." });
      return;
    }

    const normalizedReference = reference.trim().toLowerCase();
    if (normalizedReference) {
      if (seenReferences.has(normalizedReference)) {
        issues.push({ rowNumber, severity: "warning", message: `Reference ${reference} appears more than once in this import batch.` });
      }
      if (existingReferences.has(normalizedReference)) {
        issues.push({ rowNumber, severity: "warning", message: `Reference ${reference} already exists in this bank account and may be a duplicate import.` });
      }
      seenReferences.add(normalizedReference);
    } else {
      issues.push({ rowNumber, severity: "warning", message: "Reference is blank. Matching may require manual review after import." });
    }

    if (!description.trim()) {
      issues.push({ rowNumber, severity: "warning", message: "Description is blank. Add a clearer description for easier matching." });
    }

    if (valueDate && valueDate < transactionDate) {
      warnings.add("Some value dates occur before the transaction date. Review bank export formatting.");
    }

    lines.push({
      transactionDate,
      valueDate: valueDate ?? undefined,
      reference: reference || undefined,
      description: description || undefined,
      debit: nextDebit || undefined,
      credit: nextCredit || undefined,
      runningBalance: Number.isFinite(runningBalance as number) ? (runningBalance as number) : undefined,
    });
  });

  return { lines, issues, warnings: [...warnings] };
}

export function buildExecutionSummary(input: {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedRows: number;
  skippedRows: number;
  failedRows: number;
  generatedRecords?: Array<string | { id: number; reference?: string | null; transactionDate?: string | null }>;
  warnings?: string[];
  errors?: string[];
}): ImportExecutionSummary {
  return {
    totalRows: input.totalRows,
    validRows: input.validRows,
    invalidRows: input.invalidRows,
    importedRows: input.importedRows,
    skippedRows: input.skippedRows,
    failedRows: input.failedRows,
    generatedRecords: (input.generatedRecords ?? []).map((record) => {
      if (typeof record === "string") {
        return record;
      }

      return `Statement line ${record.id}${record.reference ? ` · ${record.reference}` : ""}${record.transactionDate ? ` · ${record.transactionDate}` : ""}`;
    }),
    warnings: input.warnings ?? [],
    errors: input.errors ?? [],
  };
}
