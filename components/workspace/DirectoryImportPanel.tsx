"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { parseSpreadsheetFile } from "@/lib/spreadsheet";
import {
  analyzeDirectoryImportMapping,
  getDirectoryImportFieldLabel,
  parseImportTable,
  type DirectoryImportEntity,
  type DirectoryImportField,
  type DirectoryImportLogEntry,
} from "@/lib/directory-import";
import type { DraftIssue, ImportExecutionSummary, MappingAnalysis, ParsedImportTable } from "@/lib/reconciliation-import";

type PreviewColumn<T> = {
  label: string;
  value: (row: T) => string | number;
};

type ImportOutcome<T> = {
  created: T[];
  summary: ImportExecutionSummary;
};

type DirectoryImportPanelProps<TDraft, TCreated> = {
  entity: DirectoryImportEntity;
  title: string;
  description: string;
  exampleSource: string;
  sourceLabelDefault: string;
  fields: DirectoryImportField[];
  requiredFields: DirectoryImportField[];
  storageKey: string;
  importActorLabel: string;
  buildPreview: (table: ParsedImportTable, mapping: Record<DirectoryImportField, string>) => { rows: TDraft[]; issues: DraftIssue[]; warnings: string[] };
  previewColumns: PreviewColumn<TDraft>[];
  importRows: (rows: TDraft[]) => Promise<ImportOutcome<TCreated>>;
  onCreated: (rows: TCreated[]) => void;
};

function toneClass(severity: DraftIssue["severity"]) {
  return severity === "error"
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

export function DirectoryImportPanel<TDraft, TCreated>({
  entity,
  title,
  description,
  exampleSource,
  sourceLabelDefault,
  fields,
  requiredFields,
  storageKey,
  importActorLabel,
  buildPreview,
  previewColumns,
  importRows,
  onCreated,
}: DirectoryImportPanelProps<TDraft, TCreated>) {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState(exampleSource);
  const [sourceLabel, setSourceLabel] = useState(sourceLabelDefault);
  const [parsedTable, setParsedTable] = useState<ParsedImportTable>({ headers: [], rows: [], delimiter: "," });
  const [mapping, setMapping] = useState<Record<DirectoryImportField, string>>(() => fields.reduce<Record<DirectoryImportField, string>>((result, field) => {
    result[field] = "";
    return result;
  }, {} as Record<DirectoryImportField, string>));
  const [analysis, setAnalysis] = useState<MappingAnalysis>({
    duplicateTargets: [],
    missingRequiredTargets: [],
    unmappedSourceHeaders: [],
    mappedSourceHeaders: [],
  });
  const [previewRows, setPreviewRows] = useState<TDraft[]>([]);
  const [issues, setIssues] = useState<DraftIssue[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [summary, setSummary] = useState<ImportExecutionSummary | null>(null);
  const [logs, setLogs] = useState<DirectoryImportLogEntry[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        setLogs(JSON.parse(stored) as DirectoryImportLogEntry[]);
      }
    } catch {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey]);

  function persistLogs(nextLogs: DirectoryImportLogEntry[]) {
    setLogs(nextLogs);
    window.localStorage.setItem(storageKey, JSON.stringify(nextLogs));
  }

  function rebuild(nextTable: ParsedImportTable, nextMapping: Record<DirectoryImportField, string>) {
    setParsedTable(nextTable);
    setMapping(nextMapping);
    setAnalysis(analyzeDirectoryImportMapping(nextTable.headers, nextMapping, requiredFields));
    const preview = buildPreview(nextTable, nextMapping);
    setPreviewRows(preview.rows);
    setIssues(preview.issues);
    setWarnings(preview.warnings);
    setSummary(null);
  }

  function previewImport() {
    const nextTable = parseImportTable(source);
    if (!nextTable.headers.length || !nextTable.rows.length) {
      setNotice("Provide a header row and at least one data row before previewing the import.");
      setParsedTable(nextTable);
      setPreviewRows([]);
      setIssues([]);
      setWarnings([]);
      return;
    }

    const nextMapping = fields.reduce<Record<DirectoryImportField, string>>((result, field) => {
      result[field] = mapping[field] ?? "";
      return result;
    }, {} as Record<DirectoryImportField, string>);

    rebuild(nextTable, nextMapping);
    setNotice(`Prepared ${nextTable.rows.length} source row${nextTable.rows.length === 1 ? "" : "s"} for ${entity} import review.`);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSourceLabel(file.name);
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      const parsedFile = await parseSpreadsheetFile(file);
      const nextSource = [parsedFile.headers.join(","), ...parsedFile.rows.map((row) => parsedFile.headers.map((header) => row[header] ?? "").join(","))].join("\n");
      setSource(nextSource);
      return;
    }

    setSource(await file.text());
  }

  async function handleImport() {
    if (!previewRows.length) {
      setNotice("Preview the import before submitting it.");
      return;
    }

    const blockingIssues = issues.filter((issue) => issue.severity === "error");
    if (blockingIssues.length) {
      setNotice("Resolve blocking validation errors before running the import.");
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const result = await importRows(previewRows);
      onCreated(result.created);
      setSummary(result.summary);
      const entry: DirectoryImportLogEntry = {
        id: `${entity}-${Date.now()}`,
        entity,
        importedBy: importActorLabel,
        sourceLabel,
        importedAt: new Date().toISOString(),
        resultSummary: `${result.summary.importedRows} imported / ${result.summary.failedRows} failed / ${result.summary.skippedRows} skipped`,
        summary: result.summary,
      };
      persistLogs([entry, ...logs].slice(0, 8));
      setNotice(`Imported ${result.summary.importedRows} ${entity === "customer" ? "customer" : "item"}${result.summary.importedRows === 1 ? "" : "s"}.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="rounded-[1.25rem] bg-white/95 p-4" data-inspector-import-panel={entity}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <Button variant="secondary" onClick={() => setIsOpen((current) => !current)}>{isOpen ? "Close Import" : "Open Import"}</Button>
      </div>

      {isOpen ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink">Paste rows or CSV</label>
                <textarea
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  rows={10}
                  className="block w-full rounded-[var(--radius-sm)] border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand/45 focus:ring-2 focus:ring-brand/10"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-line px-3 py-2 text-sm text-ink hover:bg-surface-soft/40">
                  <input type="file" className="hidden" accept=".csv,.txt,.xlsx,.xls" onChange={(event) => void handleFileChange(event)} />
                  Upload file
                </label>
                <span className="text-xs text-muted">Source: {sourceLabel}</span>
                <Button onClick={previewImport}>Preview Import</Button>
                <Button variant="secondary" onClick={() => void handleImport()} disabled={saving}>{saving ? "Importing" : "Run Import"}</Button>
              </div>
              {notice ? <div className="rounded-xl border border-line bg-surface-soft/40 px-3 py-2 text-sm text-ink">{notice}</div> : null}
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-line bg-surface-soft/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">Mapping</p>
                <div className="mt-3 grid gap-2">
                  {fields.map((field) => (
                    <label key={field} className="grid gap-1 text-sm text-ink md:grid-cols-[10rem_minmax(0,1fr)] md:items-center">
                      <span className="font-semibold">{getDirectoryImportFieldLabel(field)}{requiredFields.includes(field) ? " *" : ""}</span>
                      <select
                        value={mapping[field] ?? ""}
                        onChange={(event) => {
                          const nextMapping = { ...mapping, [field]: event.target.value };
                          rebuild(parsedTable, nextMapping);
                        }}
                        className="rounded-[var(--radius-sm)] border border-line-strong bg-white px-2.5 py-2 text-sm text-ink outline-none focus:border-brand/45 focus:ring-2 focus:ring-brand/10"
                      >
                        <option value="">Not mapped</option>
                        {parsedTable.headers.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                {analysis.missingRequiredTargets.length ? (
                  <p className="mt-3 text-xs text-red-700">Required mappings missing: {analysis.missingRequiredTargets.map((field) => getDirectoryImportFieldLabel(field as DirectoryImportField)).join(", ")}.</p>
                ) : null}
                {analysis.unmappedSourceHeaders.length ? (
                  <p className="mt-2 text-xs text-muted">Unmapped source headers: {analysis.unmappedSourceHeaders.join(", ")}.</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
            <div className="rounded-xl border border-line bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">Preview</p>
                <span className="text-xs text-muted">{previewRows.length} ready row{previewRows.length === 1 ? "" : "s"}</span>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-line bg-surface-soft/40">
                    <tr>
                      {previewColumns.map((column) => (
                        <th key={column.label} className="px-3 py-2 text-left font-semibold text-muted">{column.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.length ? previewRows.map((row, index) => (
                      <tr key={index} className="border-t border-line/70">
                        {previewColumns.map((column) => (
                          <td key={column.label} className="px-3 py-2 text-ink">{String(column.value(row) ?? "-")}</td>
                        ))}
                      </tr>
                    )) : (
                      <tr>
                        <td className="px-3 py-4 text-muted" colSpan={previewColumns.length}>Preview the import to inspect normalized rows before submission.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-line bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">Validation</p>
                <div className="mt-3 space-y-2">
                  {issues.length ? issues.map((issue, index) => (
                    <div key={`${issue.rowNumber}-${index}`} className={`rounded-lg border px-3 py-2 text-sm ${toneClass(issue.severity)}`}>
                      Row {issue.rowNumber}: {issue.message}
                    </div>
                  )) : <p className="text-sm text-muted">No row-level validation issues detected.</p>}
                  {warnings.map((warning) => (
                    <div key={warning} className="rounded-lg border border-line bg-surface-soft/30 px-3 py-2 text-sm text-muted">{warning}</div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-line bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">Execution Summary</p>
                {summary ? (
                  <div className="mt-3 space-y-1 text-sm text-ink">
                    <p>Total rows: {summary.totalRows}</p>
                    <p>Imported: {summary.importedRows}</p>
                    <p>Skipped: {summary.skippedRows}</p>
                    <p>Failed: {summary.failedRows}</p>
                    {summary.generatedRecords.length ? <p>Generated records: {summary.generatedRecords.join(", ")}</p> : null}
                  </div>
                ) : <p className="mt-3 text-sm text-muted">Run the import to capture execution proof here.</p>}
              </div>

              <div className="rounded-xl border border-line bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">Import Log</p>
                <div className="mt-3 space-y-2">
                  {logs.length ? logs.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-line bg-surface-soft/30 px-3 py-2 text-sm text-ink">
                      <p className="font-semibold">{entry.sourceLabel}</p>
                      <p className="text-xs text-muted">{entry.resultSummary} • {new Date(entry.importedAt).toLocaleString("en-SA")}</p>
                    </div>
                  )) : <p className="text-sm text-muted">No imports have been logged in this browser yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}