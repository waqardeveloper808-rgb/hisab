"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import type { EngineSection, SystemCorrectionOverview } from "@/lib/system-correction-engine";

function statusTone(status: EngineSection["status"]) {
  return status === "PASS"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : status === "FAIL"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-800";
}

export function SystemAuditDashboard() {
  const [overview, setOverview] = useState<SystemCorrectionOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [openEngine, setOpenEngine] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function runAudit() {
      const response = await fetch("/api/system-correction/overview", { cache: "no-store" });
      const payload = await response.json() as { data?: SystemCorrectionOverview };

      if (active && payload.data) {
        setOverview(payload.data);
        setLoading(false);
      }
    }

    void runAudit();

    return () => {
      active = false;
    };
  }, []);

  const engines = overview?.engines ?? [];
  const totalFailItems = useMemo(() => engines.reduce((count, engine) => count + engine.failItems.length, 0), [engines]);
  const totalPartialItems = useMemo(() => engines.reduce((count, engine) => count + engine.partialItems.length, 0), [engines]);

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-white/70 bg-white/95 p-6 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">System Correction</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Live Engine Monitoring</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">This monitoring surface reads live session, data visibility, DB audit, VAT, inventory, and reports checks. It only lists real FAIL and PARTIAL items from the server-backed correction engine.</p>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Session", overview?.session.valid ? "Valid" : loading ? "Running" : "Invalid", "Workspace session must carry company_id, user_id, and auth_token."],
          ["Fail items", loading ? "Running" : String(totalFailItems), "Server-backed FAIL items from the live correction engine."],
          ["Partial items", loading ? "Running" : String(totalPartialItems), "PARTIAL items that still need follow-up in the next phase."],
          ["Visibility", loading ? "Running" : `${overview?.dataVisibility.invoices ?? 0}/${overview?.dataVisibility.stock ?? 0}/${overview?.dataVisibility.customers ?? 0}`, "Invoice / stock / customer live rows visible through company-scoped routes."],
        ].map(([title, value, caption]) => (
          <Card key={title} className="rounded-xl bg-white/95 p-5">
            <p className="text-sm font-semibold text-muted">{title}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{caption}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {engines.map((engine) => {
          const isOpen = openEngine === engine.key;
          const items = [...engine.failItems, ...engine.partialItems];

          return (
            <Card key={engine.key} className="rounded-xl bg-white/95 p-4">
              <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpenEngine((current) => current === engine.key ? null : engine.key)}>
                <div>
                  <p className="text-lg font-semibold text-ink">{engine.label}</p>
                  <p className="text-sm text-muted">{engine.failItems.length} fail items, {engine.partialItems.length} partial items</p>
                </div>
                <span className={["rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]", statusTone(engine.status)].join(" ")}>{engine.status}</span>
              </button>

              {isOpen ? (
                <div className="mt-4 space-y-3">
                  {items.length === 0 ? <p className="text-sm text-muted">No fail or partial items in this engine.</p> : null}
                  {items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-line bg-surface-soft px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">{item.status === "FAIL" ? "❌" : "⚠"} {item.title}</p>
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{item.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{item.shortReason}</p>
                      <p className="mt-1 text-xs text-ink">{item.reason}</p>
                      {item.suggestion ? <p className="mt-2 text-xs font-medium text-primary">Action: {item.suggestion}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button size="xs" variant="secondary" onClick={() => window.location.reload()}>Refresh live checks</Button>
      </div>
    </div>
  );
}