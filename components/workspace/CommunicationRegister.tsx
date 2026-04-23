"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { CommunicationStatusBadge } from "@/components/workspace/CommunicationStatusBadge";
import { listCommunications, type CommunicationRecord } from "@/lib/workspace-api";

export function CommunicationRegister() {
  const [records, setRecords] = useState<CommunicationRecord[]>([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    listCommunications({ status: status === "all" ? undefined : status, limit: 100 })
      .then((result) => {
        if (active) {
          setRecords(result);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Communications could not be loaded.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [status]);

  return (
    <div className="space-y-4" data-inspector-register="communication-register">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Operations</p>
          <h1 className="text-xl font-semibold text-ink">Communication register</h1>
          <p className="text-sm text-muted">Live delivery history across document sends, retries, and in-app events.</p>
        </div>
        <div className="w-full max-w-[180px]">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink" htmlFor="communication-status-filter">Status</label>
          <select id="communication-status-filter" className="block h-[var(--control-input)] w-full rounded-[var(--radius-sm)] border border-line-strong bg-white px-2.5 text-sm text-ink" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All</option>
            <option value="sent">Sent</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="grid gap-3">
        {loading ? <Card><p className="text-sm text-muted">Loading communications...</p></Card> : null}
        {!loading && records.length === 0 ? <Card><p className="text-sm text-muted">No communications match the current filter.</p></Card> : null}
        {records.map((record) => (
          <Card key={record.id} className="space-y-2 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">{record.subject || "Communication"}</p>
                <p className="text-xs text-muted">{record.sourceRecordType || record.sourceType || "General"} · {record.targetAddress || record.targetName || "Internal"}</p>
              </div>
              <CommunicationStatusBadge communication={record} />
            </div>
            <p className="text-sm text-muted">{record.bodyText || "No message preview available."}</p>
            <div className="flex flex-wrap gap-3 text-[11px] text-muted">
              <span>Created: {record.createdAt ? new Date(record.createdAt).toLocaleString() : "-"}</span>
              <span>Attempts: {record.attempts.length}</span>
              <span>Retry count: {record.retryCount}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}