"use client";

import { useId, useState } from "react";
import { Button } from "@/components/Button";
import { exportRowsToCsv, exportRowsToWorkbook, parseSpreadsheetFile, type SpreadsheetRow } from "@/lib/spreadsheet";

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
  xlsxExportFileName?: string;
  pdfExportLabel?: string;
  onExportPdf?: () => void;
  onImportFile?: (payload: {
    file: File;
    rows: SpreadsheetRow[];
    headers: string[];
    fileName: string;
  }) => Promise<{
    createdCount: number;
    skippedCount?: number;
    message?: string;
    errors?: Array<{ rowNumber: number; field?: string; message: string }>;
  }>;
};

export function ImportExportControls<Row extends Record<string, unknown>>({
  label,
  rows,
  exportFileName,
  columns,
  importBlockedReason = "Import processing is not available in this workspace mode yet.",
  importRules = [],
  importAcceptedTypes = ".csv,.xlsx",
  xlsxExportFileName,
  pdfExportLabel = "PDF",
  onExportPdf,
  onImportFile,
}: ImportExportControlsProps<Row>) {
  const [showImport, setShowImport] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  async function handleImport() {
    if (!selectedFile || !onImportFile) {
      return;
    }

    setImportState({ status: "parsing", message: "Parsing spreadsheet…", parsedRows: 0, headers: [], errors: [] });

    try {
      const parsed = await parseSpreadsheetFile(selectedFile);

      setImportState((current) => ({
        ...current,
        parsedRows: parsed.rows.length,
        headers: parsed.headers,
        message: `Parsed ${parsed.rows.length} rows. Validating import…`,
      }));

      const result = await onImportFile({
        file: selectedFile,
        rows: parsed.rows,
        headers: parsed.headers,
        fileName: parsed.fileName,
      });

      const nextStatus = result.errors?.length ? "error" : "success";
      setImportState({
        status: nextStatus,
        message: result.message ?? (nextStatus === "success"
          ? `Imported ${result.createdCount} ${label}.`
          : `Imported ${result.createdCount} ${label} with validation issues.`),
        parsedRows: parsed.rows.length,
        headers: parsed.headers,
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
              <Button size="xs" onClick={() => void handleImport()} disabled={!selectedFile || importState.status === "parsing" || importState.status === "importing"}>
                {importState.status === "parsing" || importState.status === "importing" ? "Working" : `Validate & Import ${label}`}
              </Button>
              <Button size="xs" variant="secondary" onClick={() => {
                setSelectedFile(null);
                setImportState({ status: "idle", message: "", parsedRows: 0, headers: [], errors: [] });
              }}>Clear</Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}