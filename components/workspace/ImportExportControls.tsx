"use client";

import { useId, useState } from "react";
import { Button } from "@/components/Button";
import { exportRowsToCsv, exportRowsToWorkbook, parseSpreadsheetFile, type SpreadsheetRow } from "@/lib/spreadsheet";

type ImportMappingField = {
  key: string;
  label: string;
  required?: boolean;
  aliases?: readonly string[];
};

type ImportExportControlsProps<Row extends Record<string, unknown>> = {
  label: string;
  rows: Row[];
  exportFileName: string;
  columns: Array<{
    label: string;
    value: (row: Row) => string | number | boolean | null | undefined;
  }>;
  importBlockedReason?: string;
  importRules?: string[];
  importAcceptedTypes?: string;
  importMappingFields?: ImportMappingField[];
  xlsxExportFileName?: string;
  pdfExportLabel?: string;
  onExportPdf?: () => void;
  onImportFile?: (payload: {
    file: File;
    rows: SpreadsheetRow[];
    mappedRows: SpreadsheetRow[];
    headers: string[];
    fileName: string;
    mapping: Record<string, string>;
  }) => Promise<{
    createdCount: number;
    skippedCount?: number;
    message?: string;
    errors?: Array<{ rowNumber: number; field?: string; message: string }>;
  }>;
};

function normalizeImportToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function scoreImportHeaderMatch(header: string, field: ImportMappingField) {
  const normalizedHeader = normalizeImportToken(header);
  const targets = [field.key, field.label, ...(field.aliases ?? [])].map(normalizeImportToken);

  if (targets.includes(normalizedHeader)) {
    return 3;
  }

  if (targets.some((target) => target.includes(normalizedHeader) || normalizedHeader.includes(target))) {
    return 2;
  }

  const businessFamilies: Record<string, string[]> = {
    customer: ["customer", "client", "buyer", "contact", "company"],
    supplier: ["supplier", "vendor", "payee"],
    item: ["item", "product", "service", "sku", "code"],
    quantity: ["qty", "quantity", "units", "count"],
    tax: ["tax", "vat", "rate"],
    issue: ["issue", "invoice", "date", "created"],
    amount: ["amount", "total", "grandtotal", "price", "rate"],
  };

  const familyMatch = Object.values(businessFamilies).some((family) => {
    const targetSide = targets.some((target) => family.some((keyword) => target.includes(keyword)));
    const headerSide = family.some((keyword) => normalizedHeader.includes(keyword));
    return targetSide && headerSide;
  });

  return familyMatch ? 1 : 0;
}

export function ImportExportControls<Row extends Record<string, unknown>>({
  label,
  rows,
  exportFileName,
  columns,
  importBlockedReason = "Import processing is not available in this workspace mode yet.",
  importRules = [],
  importAcceptedTypes = ".csv,.xlsx",
  importMappingFields = [],
  xlsxExportFileName,
  pdfExportLabel = "PDF",
  onExportPdf,
  onImportFile,
}: ImportExportControlsProps<Row>) {
  const [showImport, setShowImport] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedImport, setParsedImport] = useState<{
    rows: SpreadsheetRow[];
    headers: string[];
    fileName: string;
    mapping: Record<string, string>;
  } | null>(null);
  const [importState, setImportState] = useState<{
    status: "idle" | "parsing" | "importing" | "success" | "error";
    message: string;
    parsedRows: number;
    headers: string[];
    errors: Array<{ rowNumber: number; field?: string; message: string }>;
  }>({
    status: "idle",
    message: "",
    parsedRows: 0,
    headers: [],
    errors: [],
  });
  const inputId = useId();

  function suggestMapping(headers: string[]) {
    return importMappingFields.reduce<Record<string, string>>((result, field) => {
      const matchedHeader = [...headers]
        .sort((left, right) => scoreImportHeaderMatch(right, field) - scoreImportHeaderMatch(left, field))[0];
      result[field.key] = matchedHeader ?? "";
      return result;
    }, {});
  }

  function mapRows(rows: SpreadsheetRow[], mapping: Record<string, string>) {
    return rows.map((row) => Object.entries(mapping).reduce<SpreadsheetRow>((result, [targetField, sourceHeader]) => {
      result[targetField] = sourceHeader ? row[sourceHeader] ?? "" : "";
      return result;
    }, {}));
  }

  async function handleParseImport() {
    if (!selectedFile) {
      return;
    }

    setImportState({ status: "parsing", message: "Parsing spreadsheet…", parsedRows: 0, headers: [], errors: [] });

    try {
      const parsed = await parseSpreadsheetFile(selectedFile);
      setParsedImport({
        rows: parsed.rows,
        headers: parsed.headers,
        fileName: parsed.fileName,
        mapping: suggestMapping(parsed.headers),
      });
      setImportState({
        status: "idle",
        message: `Parsed ${parsed.rows.length} rows. Review the detected columns before importing.`,
        parsedRows: parsed.rows.length,
        headers: parsed.headers,
        errors: [],
      });
    } catch (error) {
      setParsedImport(null);
      setImportState({
        status: "error",
        message: error instanceof Error ? error.message : `Import failed for ${label}.`,
        parsedRows: 0,
        headers: [],
        errors: [],
      });
    }
  }

  async function handleImport() {
    if (!selectedFile || !onImportFile) {
      return;
    }

    if (!parsedImport) {
      await handleParseImport();
      return;
    }

    const missingRequiredFields = importMappingFields
      .filter((field) => field.required && !parsedImport.mapping[field.key])
      .map((field) => field.label);

    if (missingRequiredFields.length) {
      setImportState((current) => ({
        ...current,
        status: "error",
        message: `Map the required fields before importing: ${missingRequiredFields.join(", ")}.`,
      }));
      return;
    }

    setImportState((current) => ({
      ...current,
      status: "importing",
      message: `Validating ${parsedImport.rows.length} rows…`,
      errors: [],
    }));

    try {
      const mappedRows = importMappingFields.length ? mapRows(parsedImport.rows, parsedImport.mapping) : parsedImport.rows;

      const result = await onImportFile({
        file: selectedFile,
        rows: parsedImport.rows,
        mappedRows,
        headers: parsedImport.headers,
        fileName: parsedImport.fileName,
        mapping: parsedImport.mapping,
      });

      const nextStatus = result.errors?.length ? "error" : "success";
      setImportState({
        status: nextStatus,
        message: result.message ?? (nextStatus === "success"
          ? `Imported ${result.createdCount} ${label}.`
          : `Imported ${result.createdCount} ${label} with validation issues.`),
        parsedRows: parsedImport.rows.length,
        headers: parsedImport.headers,
        errors: result.errors ?? [],
      });
    } catch (error) {
      setImportState({
        status: "error",
        message: error instanceof Error ? error.message : `Import failed for ${label}.`,
        parsedRows: 0,
        headers: [],
        errors: [],
      });
    }
  }

  const importSummary = parsedImport ? {
    mappedRequired: importMappingFields.filter((field) => field.required && parsedImport.mapping[field.key]).length,
    totalRequired: importMappingFields.filter((field) => field.required).length,
    mappedOptional: importMappingFields.filter((field) => !field.required && parsedImport.mapping[field.key]).length,
    totalOptional: importMappingFields.filter((field) => !field.required).length,
    unmapped: importMappingFields.filter((field) => !parsedImport.mapping[field.key]),
  } : null;

  return (
    <div className="flex flex-wrap items-center gap-1" data-inspector-import-export="true">
      <Button variant="secondary" size="xs" onClick={() => setShowImport((current) => !current)}>Import</Button>
      <Button variant="secondary" size="xs" onClick={() => exportRowsToCsv(rows, columns, exportFileName)}>CSV</Button>
      <Button variant="secondary" size="xs" onClick={() => exportRowsToWorkbook(rows, columns, xlsxExportFileName ?? exportFileName.replace(/\.csv$/i, ".xlsx"))}>XLSX</Button>
      {onExportPdf ? <Button variant="secondary" size="xs" onClick={onExportPdf}>{pdfExportLabel}</Button> : null}
      {showImport ? (
        <div className="basis-full rounded-lg border border-line bg-surface-soft px-2.5 py-2.5 text-xs text-muted">
          <label htmlFor={inputId} className="mb-2 block font-semibold text-ink">Import {label}</label>
          {importRules.length ? (
            <div className="mb-2 rounded-lg border border-line bg-white px-3 py-2.5">
              <p className="font-semibold text-ink">Validation rules</p>
              <ul className="mt-1 space-y-1">
                {importRules.map((rule) => <li key={rule}>• {rule}</li>)}
              </ul>
            </div>
          ) : null}
          <input
            id={inputId}
            type="file"
            accept={importAcceptedTypes}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setSelectedFile(file);
              setParsedImport(null);
              setImportState({
                status: "idle",
                message: file ? `${file.name} selected.` : "",
                parsedRows: 0,
                headers: [],
                errors: [],
              });
            }}
            className="block w-full text-xs"
          />
          <p className="mt-2">{selectedFile ? `Selected: ${selectedFile.name}. ` : ""}{onImportFile ? "Accepted formats: CSV and XLSX." : importBlockedReason}</p>
          {importState.headers.length ? <p className="mt-2">Detected columns: {importState.headers.join(", ")}</p> : null}
          {parsedImport && importSummary ? (
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <div className="rounded-lg border border-line bg-white px-3 py-2 text-ink">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Rows parsed</p>
                <p className="mt-1 text-lg font-bold">{parsedImport.rows.length}</p>
                <p className="text-[11px] text-muted">Dry-run preview before commit.</p>
              </div>
              <div className="rounded-lg border border-line bg-white px-3 py-2 text-ink">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Required fields</p>
                <p className="mt-1 text-lg font-bold">{importSummary.mappedRequired}/{importSummary.totalRequired}</p>
                <p className="text-[11px] text-muted">Business-critical fields mapped.</p>
              </div>
              <div className="rounded-lg border border-line bg-white px-3 py-2 text-ink">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Optional fields</p>
                <p className="mt-1 text-lg font-bold">{importSummary.mappedOptional}/{importSummary.totalOptional}</p>
                <p className="text-[11px] text-muted">Extra detail retained where available.</p>
              </div>
            </div>
          ) : null}
          {parsedImport && importMappingFields.length ? (
            <div className="mt-3 rounded-lg border border-line bg-white px-3 py-3 text-ink">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">Column mapping</p>
                  <p className="mt-1 text-[11px] text-muted">Headers were matched using business-language aliases, then normalized for import.</p>
                </div>
                {importSummary?.unmapped.length ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-900">
                    Unmapped: {importSummary.unmapped.map((field) => field.label).join(", ")}
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[11px] text-emerald-800">All configured fields are mapped.</div>
                )}
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {importMappingFields.map((field) => (
                  <div key={field.key}>
                    <label htmlFor={`${inputId}-${field.key}`} className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{field.label}{field.required ? " *" : ""}</label>
                    <select
                      id={`${inputId}-${field.key}`}
                      value={parsedImport.mapping[field.key] ?? ""}
                      onChange={(event) => {
                        const nextHeader = event.target.value;
                        setParsedImport((current) => current ? {
                          ...current,
                          mapping: {
                            ...current.mapping,
                            [field.key]: nextHeader,
                          },
                        } : current);
                      }}
                      className="block w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                    >
                      <option value="">Do not map</option>
                      {parsedImport.headers.map((header) => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-muted">
                      {parsedImport.mapping[field.key]
                        ? `Mapped from ${parsedImport.mapping[field.key]}.`
                        : field.required
                          ? "Required before import."
                          : "Optional field can remain unmapped."}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 overflow-auto rounded-lg border border-line">
                <table className="min-w-full text-left text-[11px]">
                  <thead className="bg-surface-soft text-muted">
                    <tr>
                      {importMappingFields.slice(0, 6).map((field) => (
                        <th key={field.key} className="px-2 py-1.5 font-semibold uppercase tracking-[0.08em]">{field.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mapRows(parsedImport.rows.slice(0, 4), parsedImport.mapping).map((row, index) => (
                      <tr key={`preview-row-${index}`} className="border-t border-line/70">
                        {importMappingFields.slice(0, 6).map((field) => (
                          <td key={`${index}-${field.key}`} className="px-2 py-1.5 text-ink">{row[field.key] || "-"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          {importState.message ? <p className={["mt-2", importState.status === "error" ? "text-red-700" : importState.status === "success" ? "text-emerald-700" : "text-muted"].join(" ")}>{importState.message}</p> : null}
          {importState.errors.length ? (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              <p className="font-semibold">Validation issues</p>
              <ul className="mt-1 space-y-1">
                {importState.errors.slice(0, 8).map((item, index) => (
                  <li key={`${item.rowNumber}-${item.field ?? "general"}-${index}`}>• Row {item.rowNumber}{item.field ? ` · ${item.field}` : ""}: {item.message}</li>
                ))}
              </ul>
              {importState.errors.length > 8 ? <p className="mt-1">+ {importState.errors.length - 8} more issues</p> : null}
            </div>
          ) : null}
          {onImportFile ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="xs" variant="secondary" onClick={() => void handleParseImport()} disabled={!selectedFile || importState.status === "parsing" || importState.status === "importing"}>
                {importState.status === "parsing" ? "Parsing" : "Preview import"}
              </Button>
              <Button size="xs" onClick={() => void handleImport()} disabled={!selectedFile || importState.status === "parsing" || importState.status === "importing"}>
                {importState.status === "importing" ? "Importing" : `Validate & Import ${label}`}
              </Button>
              <Button size="xs" variant="secondary" onClick={() => {
                setSelectedFile(null);
                setParsedImport(null);
                setImportState({ status: "idle", message: "", parsedRows: 0, headers: [], errors: [] });
              }}>Clear</Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}