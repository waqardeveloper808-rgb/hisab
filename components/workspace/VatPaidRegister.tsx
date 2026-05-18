"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { currency } from "@/components/workflow/utils";
import { listVatPaidDetails, type VatPaidDetailRecord } from "@/lib/workspace-api";

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMoney(amount: number): string {
  return currency(amount);
}

export function printFullVatPaidRegister(rows: VatPaidDetailRecord[]) {
  const printWindow = window.open("", "_blank", "width=1200,height=800");
  if (!printWindow) return;

  const rowsHtml = rows
    .map(
      (row) => `
    <tr>
      <td>${escapeHtml(row.documentType ?? "")}</td>
      <td>${escapeHtml(row.reference ?? "")}</td>
      <td>${escapeHtml(row.status ?? "")}</td>
      <td>${escapeHtml(row.issueDate ?? row.date ?? "")}</td>
      <td>${escapeHtml(row.vendor ?? "")}</td>
      <td>${escapeHtml(row.category ?? "")}</td>
      <td>${escapeHtml(formatMoney(row.taxableAmount ?? 0))}</td>
      <td>${escapeHtml(formatMoney(row.vatAmount ?? 0))}</td>
      <td>${escapeHtml(row.source ?? "")}</td>
    </tr>`,
    )
    .join("");

  printWindow.document.write(`<!doctype html>
    <html>
      <head>
        <title>VAT Paid Register</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
          th { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
        </style>
      </head>
      <body>
        <h1>VAT Paid Register</h1>
        <p>Total rows: ${rows.length}</p>
        <table>
          <thead>
            <tr>
              <th>Type</th><th>Reference #</th><th>Status</th><th>Issue date</th><th>Vendor</th><th>Category</th><th>Taxable</th><th>VAT</th><th>Source</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
    </html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function exportVatPaidCsv(rows: VatPaidDetailRecord[]) {
  const head = ["Type", "Reference #", "Status", "Issue date", "Vendor", "Category", "Taxable amount", "VAT amount", "Source"];
  const lines = [head.join(","), ...rows.map((row) =>
    [
      row.documentType ?? "",
      row.reference ?? "",
      row.status ?? "",
      row.issueDate ?? row.date ?? "",
      `"${String(row.vendor ?? "").replaceAll('"', '""')}"`,
      row.category ?? "",
      String(row.taxableAmount ?? 0),
      String(row.vatAmount ?? 0),
      row.source ?? "",
    ].join(",")),
  ].join("\n");
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vat-paid-register-${ymd}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function displayType(v?: string): string {
  if (v !== undefined && v !== null && String(v).trim() !== "") {
    return String(v).replaceAll("_", " ");
  }
  return "Unknown";
}

function displayStatus(v?: string): string {
  if (v !== undefined && v !== null && String(v).trim() !== "") {
    return String(v).replaceAll("_", " ");
  }
  return "Unknown";
}

export function VatPaidRegister() {
  const [rawRows, setRawRows] = useState<VatPaidDetailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<
    "issueDate" | "reference" | "vendor" | "taxableAmount" | "vatAmount" | "type" | "status"
  >("issueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await listVatPaidDetails({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setRawRows(rows);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Failed to load VAT paid details.");
      setRawRows([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rawRows) {
      if (r.documentType) set.add(r.documentType);
    }
    return [...set].sort();
  }, [rawRows]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rawRows) {
      if (r.status) set.add(r.status);
    }
    return [...set].sort();
  }, [rawRows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let next = rawRows.filter((row) => {
      if (typeFilter && row.documentType !== typeFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        row.documentType,
        row.reference,
        row.status,
        row.vendor,
        row.category,
        row.source,
        row.issueDate ?? row.date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    const dir = sortDir === "asc" ? 1 : -1;
    next = [...next].sort((a, b) => {
      switch (sortKey) {
        case "reference": {
          return (a.reference ?? "").localeCompare(b.reference ?? "") * dir;
        }
        case "vendor": {
          return (a.vendor ?? "").localeCompare(b.vendor ?? "") * dir;
        }
        case "taxableAmount": {
          return ((a.taxableAmount ?? 0) - (b.taxableAmount ?? 0)) * dir;
        }
        case "vatAmount": {
          return ((a.vatAmount ?? 0) - (b.vatAmount ?? 0)) * dir;
        }
        case "type": {
          return (a.documentType ?? "").localeCompare(b.documentType ?? "") * dir;
        }
        case "status": {
          return (a.status ?? "").localeCompare(b.status ?? "") * dir;
        }
        default: {
          const ad = (a.issueDate ?? a.date ?? "").slice(0, 10);
          const bd = (b.issueDate ?? b.date ?? "").slice(0, 10);
          return ad.localeCompare(bd) * dir;
        }
      }
    });
    return next;
  }, [rawRows, search, typeFilter, statusFilter, sortKey, sortDir]);

  const summary = useMemo(() => {
    const dates = filtered
      .map((r) => (r.issueDate ?? r.date ?? "").slice(0, 10))
      .filter(Boolean)
      .sort();
    const taxableTotal = filtered.reduce((s, r) => s + (r.taxableAmount ?? 0), 0);
    const vatTotal = filtered.reduce((s, r) => s + (r.vatAmount ?? 0), 0);
    return {
      count: filtered.length,
      taxableTotal,
      vatTotal,
      firstIssue: dates[0] ?? "—",
      lastIssue: dates[dates.length - 1] ?? "—",
    };
  }, [filtered]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "issueDate" ? "desc" : "asc");
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Registers</p>
        <h1 className="text-lg font-semibold tracking-tight text-ink">VAT Paid Register</h1>
        <p className="mt-1 text-xs text-muted">Input VAT from posted purchase and expense documents.</p>
      </div>

      <Card className="rounded-xl border border-line bg-white/95 p-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-line bg-surface-soft/60 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Total documents</p>
            <p className="mt-1 text-lg font-semibold text-ink">{summary.count}</p>
          </div>
          <div className="rounded-lg border border-line bg-surface-soft/60 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">VAT paid total</p>
            <p className="mt-1 text-lg font-semibold text-ink">{currency(summary.vatTotal)} SAR</p>
          </div>
          <div className="rounded-lg border border-line bg-surface-soft/60 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Taxable amount total</p>
            <p className="mt-1 text-lg font-semibold text-ink">{currency(summary.taxableTotal)} SAR</p>
          </div>
          <div className="rounded-lg border border-line bg-surface-soft/60 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">First issue date</p>
            <p className="mt-1 text-sm font-semibold text-ink">{summary.firstIssue}</p>
          </div>
          <div className="rounded-lg border border-line bg-surface-soft/60 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Last issue date</p>
            <p className="mt-1 text-sm font-semibold text-ink">{summary.lastIssue}</p>
          </div>
        </div>
      </Card>

      <Card className="rounded-xl bg-white/95 p-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[10rem] flex-1">
            <label className="mb-1 block text-xs font-semibold text-ink" htmlFor="vat-paid-search">
              Search
            </label>
            <input
              id="vat-paid-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Reference, vendor, type, status…"
              className="w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink" htmlFor="vat-paid-from">
              From
            </label>
            <input
              id="vat-paid-from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-md border border-line bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink" htmlFor="vat-paid-to">
              To
            </label>
            <input
              id="vat-paid-to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-md border border-line bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink" htmlFor="vat-paid-type">
              Type
            </label>
            <select
              id="vat-paid-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-primary"
            >
              <option value="">All types</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink" htmlFor="vat-paid-status">
              Status
            </label>
            <select
              id="vat-paid-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-primary"
            >
              <option value="">All statuses</option>
              {statusOptions.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={() => {
              setSearch("");
              setTypeFilter("");
              setStatusFilter("");
              setSortKey("issueDate");
              setSortDir("desc");
            }}
          >
            Reset filters
          </Button>
          <Button type="button" variant="secondary" size="xs" onClick={() => printFullVatPaidRegister(filtered)}>
            Print full register
          </Button>
          <Button type="button" size="xs" onClick={() => exportVatPaidCsv(filtered)}>
            Export CSV
          </Button>
          <Button type="button" variant="secondary" size="xs" disabled={loading} onClick={() => void load()}>
            Reload
          </Button>
        </div>
        {loadError ? <p className="mt-2 text-xs text-red-700">{loadError}</p> : null}
      </Card>

      <Card className="rounded-xl bg-white/95 p-3">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="border-b border-line bg-surface-soft/70">
              <tr>
                <th className="px-2 py-2 text-left">
                  <button type="button" className="font-semibold uppercase tracking-[0.08em] text-muted hover:text-ink" onClick={() => toggleSort("type")}>
                    Type
                  </button>
                </th>
                <th className="px-2 py-2 text-left">
                  <button type="button" className="font-semibold uppercase tracking-[0.08em] text-muted hover:text-ink" onClick={() => toggleSort("reference")}>
                    Reference #
                  </button>
                </th>
                <th className="px-2 py-2 text-left">
                  <button type="button" className="font-semibold uppercase tracking-[0.08em] text-muted hover:text-ink" onClick={() => toggleSort("status")}>
                    Status
                  </button>
                </th>
                <th className="px-2 py-2 text-left">
                  <button type="button" className="font-semibold uppercase tracking-[0.08em] text-muted hover:text-ink" onClick={() => toggleSort("issueDate")}>
                    Issue date
                  </button>
                </th>
                <th className="px-2 py-2 text-left">
                  <button type="button" className="font-semibold uppercase tracking-[0.08em] text-muted hover:text-ink" onClick={() => toggleSort("vendor")}>
                    Vendor
                  </button>
                </th>
                <th className="px-2 py-2 text-left">Category</th>
                <th className="px-2 py-2 text-right">
                  <button type="button" className="font-semibold uppercase tracking-[0.08em] text-muted hover:text-ink" onClick={() => toggleSort("taxableAmount")}>
                    Taxable amount
                  </button>
                </th>
                <th className="px-2 py-2 text-right">
                  <button type="button" className="font-semibold uppercase tracking-[0.08em] text-muted hover:text-ink" onClick={() => toggleSort("vatAmount")}>
                    VAT amount
                  </button>
                </th>
                <th className="px-2 py-2 text-left">Source</th>
                <th className="px-2 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-2 py-4 text-muted">
                    Loading VAT paid register…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-2 py-4 text-muted">
                    No rows match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const docId = row.documentId ?? row.id;
                  return (
                    <tr key={`${docId}-${row.reference}`} className="border-t border-line/70">
                      <td className="px-2 py-1.5 text-ink">{displayType(row.documentType)}</td>
                      <td className="px-2 py-1.5 font-medium text-ink">{row.reference}</td>
                      <td className="px-2 py-1.5 text-muted">{displayStatus(row.status)}</td>
                      <td className="px-2 py-1.5 text-muted">{(row.issueDate ?? row.date ?? "").slice(0, 10)}</td>
                      <td className="px-2 py-1.5 text-ink">{row.vendor}</td>
                      <td className="px-2 py-1.5 text-muted">{row.category.replaceAll("_", " ")}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{currency(row.taxableAmount ?? 0)} SAR</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{currency(row.vatAmount ?? 0)} SAR</td>
                      <td className="px-2 py-1.5 text-muted">{row.source ?? ""}</td>
                      <td className="px-2 py-1.5">
                        <Link
                          href={`/workspace/invoices/${docId}`}
                          className="text-[11px] font-semibold text-primary hover:underline"
                          data-testid={`vat-paid-row-action-${docId}`}
                        >
                          View source
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-muted">
          Showing <strong>{summary.count}</strong> row(s) after filters · sort {sortKey} ({sortDir}).
        </p>
      </Card>
    </div>
  );
}
