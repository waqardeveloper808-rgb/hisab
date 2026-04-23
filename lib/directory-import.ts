import {
  analyzeMapping,
  buildExecutionSummary,
  normalizeHeader,
  parseImportTable,
  type DraftIssue,
  type ImportExecutionSummary,
  type MappingAnalysis,
  type ParsedImportTable,
} from "@/lib/reconciliation-import";
import type { ContactPayload, ItemPayload } from "@/components/workflow/types";
import { isValidKsaVatNumber, normalizeCountryCode, validateSaudiNationalAddress } from "@/lib/ksa-business-validation";

export type DirectoryImportField =
  | "displayName"
  | "email"
  | "phone"
  | "city"
  | "country"
  | "vatNumber"
  | "street"
  | "buildingNumber"
  | "district"
  | "postalCode"
  | "secondaryNumber"
  | "sku"
  | "name"
  | "kind"
  | "salePrice"
  | "purchasePrice"
  | "taxLabel"
  | "category";

export type DirectoryImportEntity = "customer" | "item";

export type DirectoryImportPreview<T> = {
  rows: T[];
  issues: DraftIssue[];
  warnings: string[];
};

export type DirectoryImportLogEntry = {
  id: string;
  entity: DirectoryImportEntity;
  importedBy: string;
  sourceLabel: string;
  importedAt: string;
  resultSummary: string;
  summary: ImportExecutionSummary;
};

const fieldLabels: Record<DirectoryImportField, string> = {
  displayName: "Display name",
  email: "Email",
  phone: "Phone",
  city: "City",
  country: "Country",
  vatNumber: "VAT number",
  street: "Street",
  buildingNumber: "Building number",
  district: "District",
  postalCode: "Postal code",
  secondaryNumber: "Secondary number",
  sku: "SKU",
  name: "Name",
  kind: "Type",
  salePrice: "Sale price",
  purchasePrice: "Purchase price",
  taxLabel: "Tax label",
  category: "Category",
};

const fieldSuggestions: Record<DirectoryImportField, string[]> = {
  displayName: [
    "customer",
    "customer_name",
    "customer_full_name",
    "display_name",
    "full_name",
    "name",
    "contact",
    "contact_name",
    "contact_full_name",
    "party",
    "counterparty",
    "company",
    "company_name",
    "supplier",
    "supplier_name",
    "vendor",
    "vendor_name",
    "legal_name",
    "entity_name",
  ],
  email: ["email", "email_address"],
  phone: ["phone", "phone_number", "mobile", "mobile_number", "telephone", "telephone_number", "contact_number", "whatsapp", "cell"],
  city: ["city", "town"],
  country: ["country", "country_name", "nation"],
  vatNumber: ["vat", "vat_number", "vat_registration_number", "tax_number", "tax_no", "trn", "tax_registration_no"],
  street: ["street", "address", "address_line_1", "line_1", "billing_address", "mailing_address"],
  buildingNumber: ["building_number", "building", "building_no", "building_number_no"],
  district: ["district", "area", "neighborhood", "quarter"],
  postalCode: ["postal_code", "zip", "zip_code", "postcode"],
  secondaryNumber: ["secondary_number", "additional_number", "additional_no", "additional"],
  sku: ["sku", "code", "item_code", "product_code", "inventory_code"],
  name: ["name", "item", "item_name", "product", "product_name", "service_name", "display_name"],
  kind: ["type", "kind", "item_type", "record_type"],
  salePrice: ["sale_price", "selling_price", "unit_price", "price", "sales_price"],
  purchasePrice: ["purchase_price", "cost_price", "buy_price", "unit_cost", "purchase_cost"],
  taxLabel: ["tax", "tax_label", "vat", "vat_label", "tax_category"],
  category: ["category", "group", "family", "segment"],
};

function normalizeComparableHeader(value: string) {
  return normalizeHeader(value)
    .replace(/\b(no|num|number)\b/g, "number")
    .replace(/\baddr\b/g, "address")
    .replace(/\bcust\b/g, "customer")
    .replace(/\bsupp\b/g, "supplier")
    .replace(/\bvend\b/g, "vendor")
    .replace(/\bprod\b/g, "product")
    .replace(/\bsvc\b/g, "service")
    .replace(/\bfull[_-]?name\b/g, "name")
    .replace(/_+/g, "_")
    .trim();
}

function scoreHeaderMatch(header: string, suggestions: string[]) {
  const normalizedHeader = normalizeComparableHeader(header);
  if (!normalizedHeader) {
    return 0;
  }

  let bestScore = 0;

  for (const candidate of suggestions) {
    const normalizedCandidate = normalizeComparableHeader(candidate);
    if (normalizedHeader === normalizedCandidate) {
      return 100;
    }
    if (normalizedHeader.startsWith(normalizedCandidate) || normalizedCandidate.startsWith(normalizedHeader)) {
      bestScore = Math.max(bestScore, 92);
    }
    if (normalizedHeader.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedHeader)) {
      bestScore = Math.max(bestScore, 84);
    }

    const headerTokens = normalizedHeader.split("_").filter(Boolean);
    const candidateTokens = normalizedCandidate.split("_").filter(Boolean);
    const overlap = candidateTokens.filter((token) => headerTokens.includes(token)).length;
    if (overlap > 0) {
      const tokenScore = Math.round((overlap / Math.max(candidateTokens.length, headerTokens.length)) * 80);
      bestScore = Math.max(bestScore, tokenScore);
    }

    const distance = levenshteinDistance(normalizedHeader, normalizedCandidate);
    const length = Math.max(normalizedHeader.length, normalizedCandidate.length);
    if (length > 0) {
      const distanceScore = Math.round((1 - distance / length) * 70);
      bestScore = Math.max(bestScore, distanceScore);
    }
  }

  return bestScore;
}

function levenshteinDistance(left: string, right: string) {
  if (left === right) {
    return 0;
  }
  if (!left.length) {
    return right.length;
  }
  if (!right.length) {
    return left.length;
  }

  const matrix = Array.from({ length: right.length + 1 }, () => new Array<number>(left.length + 1).fill(0));
  for (let column = 0; column <= left.length; column += 1) {
    matrix[0][column] = column;
  }
  for (let row = 0; row <= right.length; row += 1) {
    matrix[row][0] = row;
  }

  for (let row = 1; row <= right.length; row += 1) {
    for (let column = 1; column <= left.length; column += 1) {
      const cost = right[row - 1] === left[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  return matrix[right.length][left.length];
}

export function normalizeImportHeaders(headers: string[]) {
  return headers.map((header) => ({
    source: header,
    normalized: normalizeComparableHeader(header),
  }));
}

const customerRequiredFields: DirectoryImportField[] = ["displayName"];
const itemRequiredFields: DirectoryImportField[] = ["name"];

function baseMapping() {
  return Object.keys(fieldLabels).reduce<Record<DirectoryImportField, string>>((mapping, field) => {
    mapping[field as DirectoryImportField] = "";
    return mapping;
  }, {} as Record<DirectoryImportField, string>);
}

function parseAmount(value: string | undefined) {
  if (!value?.trim()) {
    return 0;
  }

  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function normalizeItemKind(value: string | undefined) {
  const normalized = normalizeHeader(value ?? "");
  if (["product", "stock", "inventory", "goods", "finished_good", "finished_goods"].includes(normalized)) {
    return "product" as const;
  }

  return "service" as const;
}

export function getDirectoryImportFieldLabel(field: DirectoryImportField) {
  return fieldLabels[field];
}

export function getCustomerImportFields() {
  return ["displayName", "email", "phone", "city", "country", "vatNumber", "street", "buildingNumber", "district", "postalCode", "secondaryNumber"] as DirectoryImportField[];
}

export function getItemImportFields() {
  return ["name", "sku", "kind", "salePrice", "purchasePrice", "taxLabel", "category"] as DirectoryImportField[];
}

export function getDirectoryImportRequiredFields(entity: DirectoryImportEntity) {
  return entity === "customer" ? customerRequiredFields : itemRequiredFields;
}

export function buildDirectoryImportMapping(headers: string[], fields: DirectoryImportField[]) {
  const mapping = baseMapping();

  for (const field of fields) {
    const ranked = headers
      .map((header) => ({ header, score: scoreHeaderMatch(header, fieldSuggestions[field]) }))
      .sort((left, right) => right.score - left.score);
    const best = ranked[0];

    if (best && best.score >= 58 && !Object.values(mapping).includes(best.header)) {
      mapping[field] = best.header;
    }
  }

  return mapping;
}

export function analyzeDirectoryImportMapping(
  headers: string[],
  mapping: Record<DirectoryImportField, string>,
  requiredFields: DirectoryImportField[],
): MappingAnalysis {
  const base = analyzeMapping(headers, mapping as never);
  return {
    ...base,
    missingRequiredTargets: requiredFields.filter((field) => !mapping[field]) as never[],
  };
}

function readMappedCell(
  row: string[],
  table: ParsedImportTable,
  mapping: Record<DirectoryImportField, string>,
  field: DirectoryImportField,
) {
  const header = mapping[field];
  const index = header ? table.headers.indexOf(header) : -1;
  return index >= 0 ? (row[index] ?? "").trim() : "";
}

export function buildCustomerImportPreview(
  table: ParsedImportTable,
  mapping: Record<DirectoryImportField, string>,
  existingCustomers: string[],
): DirectoryImportPreview<ContactPayload> {
  const issues: DraftIssue[] = [];
  const warnings = new Set<string>();
  const rows: ContactPayload[] = [];
  const existingNames = new Set(existingCustomers.map((value) => value.trim().toLowerCase()).filter(Boolean));
  const batchNames = new Set<string>();

  if (!mapping.displayName) {
    issues.push({ rowNumber: 1, severity: "error", message: "Map a customer name column before previewing the import." });
    return { rows, issues, warnings: [...warnings] };
  }

  table.rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const displayName = readMappedCell(row, table, mapping, "displayName");
    const email = readMappedCell(row, table, mapping, "email");
    const phone = readMappedCell(row, table, mapping, "phone");
    const city = readMappedCell(row, table, mapping, "city");
    const country = readMappedCell(row, table, mapping, "country") || "Saudi Arabia";
    const vatNumber = readMappedCell(row, table, mapping, "vatNumber");
    const street = readMappedCell(row, table, mapping, "street");
    const buildingNumber = readMappedCell(row, table, mapping, "buildingNumber");
    const district = readMappedCell(row, table, mapping, "district");
    const postalCode = readMappedCell(row, table, mapping, "postalCode");
    const secondaryNumber = readMappedCell(row, table, mapping, "secondaryNumber");

    if (row.every((cell) => !cell.trim())) {
      return;
    }

    if (!displayName) {
      issues.push({ rowNumber, severity: "error", message: "Customer name is required." });
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      issues.push({ rowNumber, severity: "error", message: "Email address format is invalid." });
      return;
    }

    if (!isValidKsaVatNumber(vatNumber)) {
      issues.push({ rowNumber, severity: "error", message: "VAT number must be 15 digits, start with 3, end with 3, and contain numbers only." });
      return;
    }

    const addressErrors = validateSaudiNationalAddress({
      buildingNumber,
      streetName: street,
      district,
      city,
      postalCode,
      secondaryNumber,
      country: normalizeCountryCode(country),
    });
    if (Object.keys(addressErrors).length > 0) {
      issues.push({ rowNumber, severity: "error", message: Object.values(addressErrors)[0] ?? "Saudi address is incomplete." });
      return;
    }

    const normalizedName = displayName.toLowerCase();
    if (batchNames.has(normalizedName)) {
      issues.push({ rowNumber, severity: "warning", message: `Customer ${displayName} appears more than once in this import batch.` });
    }
    if (existingNames.has(normalizedName)) {
      issues.push({ rowNumber, severity: "warning", message: `Customer ${displayName} already exists and may create a duplicate.` });
    }

    batchNames.add(normalizedName);

    if (!city) {
      issues.push({ rowNumber, severity: "warning", message: "City is blank. Invoice address completion may still be needed." });
    }

    rows.push({
      kind: "customer",
      displayName,
      email,
      phone,
      city,
      country,
      vatNumber,
      street,
      buildingNumber,
      district,
      postalCode,
      secondaryNumber,
      defaultTax: "VAT 15%",
    });
  });

  if (!rows.length) {
    warnings.add("No valid customer rows were found in the supplied file.");
  }

  return { rows, issues, warnings: [...warnings] };
}

export function buildItemImportPreview(
  table: ParsedImportTable,
  mapping: Record<DirectoryImportField, string>,
  existingItems: string[],
): DirectoryImportPreview<ItemPayload> {
  const issues: DraftIssue[] = [];
  const warnings = new Set<string>();
  const rows: ItemPayload[] = [];
  const existingNames = new Set(existingItems.map((value) => value.trim().toLowerCase()).filter(Boolean));
  const batchKeys = new Set<string>();

  if (!mapping.name) {
    issues.push({ rowNumber: 1, severity: "error", message: "Map an item name column before previewing the import." });
    return { rows, issues, warnings: [...warnings] };
  }

  table.rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const name = readMappedCell(row, table, mapping, "name");
    const sku = readMappedCell(row, table, mapping, "sku");
    const kind = normalizeItemKind(readMappedCell(row, table, mapping, "kind"));
    const salePrice = parseAmount(readMappedCell(row, table, mapping, "salePrice"));
    const purchasePrice = parseAmount(readMappedCell(row, table, mapping, "purchasePrice"));
    const taxLabel = readMappedCell(row, table, mapping, "taxLabel") || "Standard VAT 15%";
    const category = readMappedCell(row, table, mapping, "category");

    if (row.every((cell) => !cell.trim())) {
      return;
    }

    if (!name) {
      issues.push({ rowNumber, severity: "error", message: "Item name is required." });
      return;
    }

    if (Number.isNaN(salePrice) || Number.isNaN(purchasePrice)) {
      issues.push({ rowNumber, severity: "error", message: "Sale and purchase prices must use plain numeric values." });
      return;
    }

    const dedupeKey = `${name.toLowerCase()}::${sku.toLowerCase()}`;
    if (batchKeys.has(dedupeKey)) {
      issues.push({ rowNumber, severity: "warning", message: `Item ${name}${sku ? ` (${sku})` : ""} appears more than once in this import batch.` });
    }
    if (existingNames.has(name.toLowerCase())) {
      issues.push({ rowNumber, severity: "warning", message: `Item ${name} already exists and may create a duplicate.` });
    }

    if (salePrice === 0 && purchasePrice === 0) {
      issues.push({ rowNumber, severity: "warning", message: "Both sale and purchase prices are zero. Review commercial defaults before posting documents." });
    }

    batchKeys.add(dedupeKey);

    rows.push({
      kind,
      name,
      sku,
      salePrice,
      purchasePrice,
      taxLabel,
      category: category || undefined,
    });
  });

  if (!rows.length) {
    warnings.add("No valid item rows were found in the supplied file.");
  }

  return { rows, issues, warnings: [...warnings] };
}

export function summarizeDirectoryImport(summary: ImportExecutionSummary) {
  return buildExecutionSummary({
    totalRows: summary.totalRows,
    validRows: summary.validRows,
    invalidRows: summary.invalidRows,
    importedRows: summary.importedRows,
    skippedRows: summary.skippedRows,
    failedRows: summary.failedRows,
    generatedRecords: summary.generatedRecords,
    warnings: summary.warnings,
    errors: summary.errors,
  });
}

export { parseImportTable };
