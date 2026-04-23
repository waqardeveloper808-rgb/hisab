"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { CommunicationStatusBadge } from "@/components/workspace/CommunicationStatusBadge";
import { listCommunicationTimeline, retryCommunication, type CommunicationRecord } from "@/lib/workspace-api";

type CommunicationTimelinePanelProps = {
  sourceType: string;
  sourceId: number | null;
  reloadKey?: number;
};

export function CommunicationTimelinePanel({ sourceType, sourceId, reloadKey = 0 }: CommunicationTimelinePanelProps) {
  const [records, setRecords] = useState<CommunicationRecord[]>([]);
  const [loading, setLoading] = useState(Boolean(sourceId));
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  useEffect(() => {
    if (!sourceId) {
      setRecords([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    listCommunicationTimeline(sourceType, sourceId)
      .then((result) => {
        if (active) {
          setRecords(result);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Timeline could not be loaded.");
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
  }, [reloadKey, sourceId, sourceType]);

  async function handleRetry(communicationId: number) {
    setRetryingId(communicationId);
    setError(null);

    try {
      const retried = await retryCommunication(communicationId);
      setRecords((current) => current.map((entry) => entry.id === communicationId ? retried : entry));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Retry could not be completed.");
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <Card className="space-y-3" data-inspector-register="communication-timeline-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Communication timeline</p>
          <h3 className="text-sm font-semibold text-ink">Delivery and event history</h3>
        </div>
        {loading ? <span className="text-xs text-muted">Loading...</span> : <span className="text-xs text-muted">{records.length} records</span>}
      </div>

      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
      {!loading && records.length === 0 ? <p className="text-sm text-muted">No communication history has been recorded for this source yet.</p> : null}

      <div className="space-y-2">
        {records.map((record) => (
          <div key={record.id} className="rounded-xl border border-line bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{record.subject || "Communication"}</p>
                <p className="text-xs text-muted">{record.targetAddress || record.targetName || "Internal event"}</p>
              </div>
              <CommunicationStatusBadge communication={record} />
            </div>
            <p className="mt-2 text-xs text-muted">{record.bodyText || "No message preview available."}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <span>Attempts: {record.attempts.length}</span>
              {record.deliveredAt ? <span>Delivered: {new Date(record.deliveredAt).toLocaleString()}</span> : null}
              {record.failedAt ? <span>Failed: {new Date(record.failedAt).toLocaleString()}</span> : null}
            </div>
            {record.attempts.length ? (
              <div className="mt-2 space-y-1 rounded-lg bg-surface-soft/60 p-2 text-[11px] text-muted">
                {record.attempts.map((attempt) => (
                  <div key={attempt.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>Attempt {attempt.attemptNumber} · {attempt.status}</span>
                    <span>{attempt.errorMessage || attempt.completedAt || attempt.attemptedAt || "Pending"}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {record.status === "failed" ? (
              <div className="mt-3 flex justify-end">
                <Button size="xs" variant="secondary" disabled={retryingId === record.id} onClick={() => void handleRetry(record.id)}>
                  {retryingId === record.id ? "Retrying..." : "Retry"}
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}