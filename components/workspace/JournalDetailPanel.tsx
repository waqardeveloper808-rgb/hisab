"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DocumentLinkTrigger } from "@/components/workspace/DocumentLinkTrigger";
import type { JournalEntryRecord } from "@/lib/workspace-api";
import { mapWorkspaceHref } from "@/lib/workspace-path";
import { currency } from "@/components/workflow/utils";

export type JournalDetailLink = {
  documentId?: number | null;
  documentNumber: string;
  documentType: string;
  status?: string | null;
};

type JournalDetailPanelProps = {
  entry: JournalEntryRecord | null;
  basePath: string;
  hasInvoiceFilter: boolean;
  invoiceFilterId: number;
  invoiceFilterNumber: string;
  linkedDocuments: JournalDetailLink[];
  onPreviewDocument: (link: JournalDetailLink) => void;
};

function humanizeStatus(status: string) {
  if (status === "posted") return "Posted";
  if (status === "draft") return "Draft";
  if (status === "reversed") return "Reversed";
  return status;
}

function humanizeSourceType(source: string | null) {
  if (!source) return "Manual / other";
  return source
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function attachmentCount(entry: JournalEntryRecord) {
  const m = entry.metadata;
  if (!m || typeof m !== "object") return 0;
  const direct = m.attachments;
  if (Array.isArray(direct)) return direct.length;
  const manifest = m.attachment_manifest;
  if (Array.isArray(manifest)) return manifest.length;
  const c = m.attachment_count;
  if (typeof c === "number" && Number.isFinite(c)) return c;
  return 0;
}

function createdAtLabel(entry: JournalEntryRecord) {
  if (entry.postedAt) {
    try {
      return new Date(entry.postedAt).toLocaleString();
    } catch {
      return entry.postedAt;
    }
  }
  if (entry.metadata && typeof entry.metadata === "object" && "created_at" in entry.metadata) {
    const v = (entry.metadata as { created_at?: string }).created_at;
    if (typeof v === "string") return v;
  }
  return "—";
}

/**
 * In-flow detail preview (not a slide-over). Parent controls width (≥50% on desktop) and height.
 */
export function JournalDetailPanel({
  entry,
  basePath,
  hasInvoiceFilter,
  invoiceFilterId,
  invoiceFilterNumber,
  linkedDocuments,
  onPreviewDocument,
}: JournalDetailPanelProps) {
  return (
    <div
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm"
      data-inspector-accounting-detail="journal-entry-panel"
    >
      <div className="shrink-0 border-b border-line px-2.5 py-1.5 sm:px-3 sm:py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary sm:text-[11px]">Journal entry</p>
        <h2
          className="mt-0.5 min-w-0 break-words text-sm font-semibold text-ink sm:text-base"
          id="journal-detail-title"
        >
          {entry?.entryNumber ?? "—"}
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2 sm:px-3 sm:py-2.5">
        {!entry ? (
          <p className="text-xs text-muted sm:text-sm">No entry selected. Load the register or pick a row.</p>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            <section className="space-y-1.5 rounded-lg border border-line bg-surface-soft/40 p-2 sm:p-2.5 text-xs sm:text-sm">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Entry header</h3>
              <dl className="grid min-w-0 grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
                <div>
                  <dt className="text-[11px] text-muted">Entry ID</dt>
                  <dd className="mt-0.5 break-words font-mono text-xs font-semibold text-ink sm:text-sm">{entry.entryNumber}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted">Date</dt>
                  <dd className="mt-0.5 text-ink">{entry.entryDate}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted">Reference no.</dt>
                  <dd className="mt-0.5 break-words text-ink">{entry.reference || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted">Reference type</dt>
                  <dd className="mt-0.5 break-words text-ink">{humanizeSourceType(entry.sourceType)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted">Status</dt>
                  <dd className="mt-0.5">
                    <span
                      className={[
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        entry.status === "posted"
                          ? "bg-emerald-100 text-emerald-900"
                          : entry.status === "draft"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-surface-soft text-muted",
                      ].join(" ")}
                    >
                      {humanizeStatus(entry.status)}
                    </span>
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Remarks</h3>
              <Card className="mt-1 rounded-lg border border-line bg-white p-2 text-xs text-ink [overflow-wrap:anywhere] whitespace-pre-wrap sm:text-sm sm:leading-relaxed">
                {entry.memo?.trim() ? entry.memo : "—"}
              </Card>
            </section>

            <section className="min-w-0">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Account impact</h3>
              <div className="mt-1 w-full min-w-0 overflow-x-hidden rounded-lg border border-line">
                <table className="journal-detail-lines-table w-full min-w-0 table-fixed border-collapse text-xs sm:text-sm">
                  <thead className="border-b border-line bg-surface-soft/80 text-left text-[10px] font-semibold uppercase tracking-[0.05em] text-muted sm:text-[11px]">
                    <tr>
                      <th className="w-[58%] px-1.5 py-1.5 sm:px-2 sm:py-1.5">Account</th>
                      <th className="w-[21%] px-1.5 py-1.5 text-right sm:px-2">Dr.</th>
                      <th className="w-[21%] px-1.5 py-1.5 text-right sm:px-2">Cr.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.lines.map((line) => {
                      const isDr = line.debit > 0;
                      return (
                        <tr key={`${entry.id}-ln-${line.lineNo}-${line.id ?? 0}`} className="border-t border-line/50">
                          <td className="min-w-0 px-1.5 py-1 sm:px-2 sm:py-1.5 [overflow-wrap:anywhere] break-words text-ink">
                            <div className="font-semibold leading-snug text-ink">{line.accountName}</div>
                            <div className="text-[10px] font-mono text-muted sm:text-[11px]">{line.accountCode}</div>
                            {line.description ? <div className="mt-0.5 text-[10px] text-muted sm:text-xs">{line.description}</div> : null}
                          </td>
                          <td className="px-1.5 py-1 align-top text-right font-mono text-[11px] tabular-nums sm:px-2 sm:py-1.5 sm:text-sm">
                            {isDr ? <span className="text-emerald-800">{currency(line.debit)}</span> : <span className="text-line/80">—</span>}
                          </td>
                          <td className="px-1.5 py-1 align-top text-right font-mono text-[11px] tabular-nums sm:px-2 sm:py-1.5 sm:text-sm">
                            {!isDr && line.credit > 0 ? <span className="text-sky-900">{currency(line.credit)}</span> : <span className="text-line/80">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t border-line bg-surface-soft/50 text-xs font-semibold text-ink sm:text-sm">
                    <tr>
                      <td className="px-1.5 py-1 sm:px-2 sm:py-1.5">Totals</td>
                      <td className="px-1.5 py-1 text-right font-mono tabular-nums sm:px-2 sm:py-1.5">
                        {currency(entry.lines.reduce((s, l) => s + l.debit, 0))}
                      </td>
                      <td className="px-1.5 py-1 text-right font-mono tabular-nums sm:px-2 sm:py-1.5">
                        {currency(entry.lines.reduce((s, l) => s + l.credit, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="mt-1 text-xs font-semibold text-emerald-700 sm:text-sm">Balanced</p>
            </section>

            <section>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Additional</h3>
              <ul className="mt-1 space-y-1 text-xs text-ink sm:text-sm">
                <li>
                  <span className="text-muted">Attachments: </span>
                  {attachmentCount(entry)}
                </li>
                <li>
                  <span className="text-muted">Created by: </span>
                  {entry.createdByName?.trim() || "—"}
                </li>
                <li>
                  <span className="text-muted">Created at: </span>
                  {createdAtLabel(entry)}
                </li>
              </ul>
            </section>

            {linkedDocuments.length > 0 ? (
              <section>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Linked documents</h3>
                <div className="mt-1 flex flex-wrap gap-1.5 sm:gap-2">
                  {linkedDocuments.map((link) => (
                    <DocumentLinkTrigger
                      key={`${link.documentType}-${link.documentNumber}`}
                      link={link}
                      onPreview={onPreviewDocument}
                      className="text-xs text-primary underline-offset-2 hover:underline sm:text-sm"
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Button
                size="xs"
                variant="secondary"
                href={mapWorkspaceHref(
                  `/workspace/accounting/books?entry=${encodeURIComponent(entry.entryNumber)}&invoice_id=${hasInvoiceFilter ? invoiceFilterId : Number(entry.lines[0]?.documentId ?? 0)}&invoice_number=${encodeURIComponent(invoiceFilterNumber || entry.lines[0]?.documentNumber || "")}`,
                  basePath,
                )}
              >
                Ledger
              </Button>
              <Button
                size="xs"
                variant="secondary"
                href={mapWorkspaceHref(
                  `/workspace/user/reports/trial-balance?invoice_id=${hasInvoiceFilter ? invoiceFilterId : Number(entry.lines[0]?.documentId ?? 0)}&invoice_number=${encodeURIComponent(invoiceFilterNumber || entry.lines[0]?.documentNumber || "")}`,
                  basePath,
                )}
              >
                Trial balance
              </Button>
              {linkedDocuments[0] ? (
                <Button
                  size="xs"
                  variant="secondary"
                  href={mapWorkspaceHref(
                    linkedDocuments[0]?.documentId
                      ? `/workspace/invoices/${linkedDocuments[0].documentId}`
                      : `/workspace/user/invoices?q=${encodeURIComponent(linkedDocuments[0]?.documentNumber ?? "")}`,
                    basePath,
                  )}
                >
                  Source document
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
