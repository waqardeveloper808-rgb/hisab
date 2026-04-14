import * as XLSX from "xlsx";

export type SpreadsheetRow = Record<string, string>;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function triggerDownload(bytes: ArrayBuffer | Uint8Array, fileName: string, mimeType: string) {
  const normalizedBytes = bytes instanceof Uint8Array
    ? Uint8Array.from(bytes)
    : new Uint8Array(bytes);
  const blob = new Blob([normalizedBytes], { type: mimeType });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

export async function parseSpreadsheetFile(file: File): Promise<{ rows: SpreadsheetRow[]; headers: string[]; fileName: string }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return { rows: [], headers: [], fileName: file.name };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const matrix = XLSX.utils.sheet_to_json<Array<string | number | boolean | null>>(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  const [headerRow = [], ...dataRows] = matrix;
  const headers = headerRow.map((value) => normalizeHeader(String(value ?? ""))).filter(Boolean);
  const rows = dataRows
    .filter((row) => row.some((value) => String(value ?? "").trim() !== ""))
    .map((row) => headers.reduce<SpreadsheetRow>((result, header, index) => {
      result[header] = String(row[index] ?? "").trim();
      return result;
    }, {}));

  return { rows, headers, fileName: file.name };
}

export function exportRowsToCsv<Row extends Record<string, unknown>>(rows: Row[], columns: Array<{ label: string; value: (row: Row) => string | number | boolean | null | undefined }>, fileName: string) {
  const escapeCsv = (value: string) => /[",\n]/.test(value) ? `"${value.replaceAll("\"", '""')}"` : value;
  const header = columns.map((column) => escapeCsv(column.label)).join(",");
  const body = rows.map((row) => columns.map((column) => escapeCsv(String(column.value(row) ?? ""))).join(",")).join("\n");
  triggerDownload(new TextEncoder().encode(`${header}\n${body}`), fileName, "text/csv;charset=utf-8;");
}

export function exportRowsToWorkbook<Row extends Record<string, unknown>>(rows: Row[], columns: Array<{ label: string; value: (row: Row) => string | number | boolean | null | undefined }>, fileName: string, sheetName = "Export") {
  const normalizedRows = rows.map((row) => columns.reduce<Record<string, string | number | boolean>>((result, column) => {
    const value = column.value(row);
    result[column.label] = value == null ? "" : value;
    return result;
  }, {}));
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(normalizedRows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  triggerDownload(bytes, fileName, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}