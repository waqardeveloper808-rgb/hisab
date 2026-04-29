"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { WorkspaceDataTable } from "@/components/workspace/WorkspaceDataTable";
import { getBooksSnapshot, type BooksSnapshot } from "@/lib/workspace-api";
import { mapWorkspaceHref } from "@/lib/workspace-path";
import { currency } from "@/components/workflow/utils";
import { Button } from "@/components/Button";
import Link from "next/link";

const empty: BooksSnapshot = { trialBalance: [], generalLedger: [], auditTrail: [], backendReady: false };

/**
 * GL-line audit view: posted journal lines as the accounting audit trail.
 * System audit log events (BooksOverview) are a different dimension — PARTIAL composite.
 */
export function AuditTrailReportPage() {
  const { basePath } = useWorkspacePath();
  const [snap, setSnap] = useState<BooksSnapshot>(empty);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    getBooksSnapshot()
      .then(setSnap)
      .catch((err) => { console.error("[AuditTrailReportPage]", err); })
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    const rows = snap.generalLedger;
    if (!q.trim()) return rows;
    const t = q.toLowerCase();
    return rows.filter((r) =>
      `${r.entryNumber} ${r.accountCode} ${r.accountName} ${r.description} ${r.documentNumber}`.toLowerCase().includes(t),
    );
  }, [q, snap.generalLedger]);

  return (
    <div data-inspector-register="audit-trail-report">
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Audit trail (posting lines)</h1>
          <p className="wsv2-page-subtitle">
            <span className="wsv2-accounting-badge wsv2-accounting-badge--partial" style={{ marginRight: 8 }}>PARTIAL</span>
            Line-level view from posted general ledger. Composite system audit (user/time/event) is separate from monitor — link below is for journal register.
          </p>
        </div>
        <div className="wsv2-page-actions">
          <Button size="sm" href={mapWorkspaceHref("/workspace/user/journal-entries", basePath)}>Journal entries</Button>
        </div>
      </div>

      <Card className="p-3">
        <label className="text-xs font-semibold text-ink" htmlFor="at-q">Filter lines</label>
        <input
          id="at-q"
          className="mt-1 w-full max-w-md rounded border border-line px-2 py-1.5 text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Entry, account, document, description"
        />
      </Card>

      {!snap.backendReady && !loading && rows.length === 0 ? (
        <p className="text-sm text-muted">No posted data in this workspace snapshot (preview) — zero-state is valid.</p>
      ) : null}

      <WorkspaceDataTable
        registerTableId="audit-trail-gl-lines"
        title="Posted lines (GL)"
        caption="Data source: getBooksSnapshot().generalLedger"
        rows={rows}
        emptyMessage="No lines match the filter."
        columns={[
          { id: "entry", header: "Entry", defaultWidth: 100, render: (r) => r.entryNumber },
          { id: "date", header: "Date", defaultWidth: 96, render: (r) => r.entryDate },
          { id: "account", header: "Account", defaultWidth: 200, render: (r) => `${r.accountCode} ${r.accountName}` },
          { id: "document", header: "Document", defaultWidth: 120, render: (r) => r.documentNumber || "—" },
          { id: "description", header: "Description", defaultWidth: 200, render: (r) => r.description || "—" },
          { id: "dr", header: "Dr", align: "right", defaultWidth: 100, render: (r) => currency(r.debit) },
          { id: "cr", header: "Cr", align: "right", defaultWidth: 100, render: (r) => currency(r.credit) },
        ]}
      />

      {snap.auditTrail.length > 0 ? (
        <WorkspaceDataTable
          registerTableId="audit-trail-events"
          title="System events (excerpt)"
          caption="getBooksSnapshot().auditTrail — not line-level; PARTIAL for full composite audit"
          rows={snap.auditTrail.slice(0, 25)}
          emptyMessage="—"
          columns={[
            { id: "event", header: "Event", defaultWidth: 160, render: (r) => r.event },
            { id: "record", header: "Record", defaultWidth: 180, render: (r) => `${r.auditableType.split("\\").pop()} #${r.auditableId}` },
            { id: "when", header: "When", defaultWidth: 160, render: (r) => r.createdAt },
          ]}
        />
      ) : null}

      <p className="text-xs text-muted">
        <Link className="text-primary" href={mapWorkspaceHref("/workspace/user/ledger", basePath)}>Open full books view</Link>
        {" · "}
        <Link className="text-primary" href={mapWorkspaceHref("/workspace/user/reports/trial-balance", basePath)}>Trial balance</Link>
      </p>
    </div>
  );
}
