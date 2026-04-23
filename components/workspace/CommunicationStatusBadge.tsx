import type { CommunicationRecord } from "@/lib/workspace-api";

const toneByStatus: Record<string, string> = {
  sent: "border-emerald-200 bg-emerald-50 text-emerald-800",
  queued: "border-amber-200 bg-amber-50 text-amber-800",
  processing: "border-sky-200 bg-sky-50 text-sky-800",
  failed: "border-rose-200 bg-rose-50 text-rose-800",
  cancelled: "border-slate-200 bg-slate-100 text-slate-700",
};

export function CommunicationStatusBadge({ communication }: { communication: CommunicationRecord }) {
  const classes = toneByStatus[communication.status] ?? "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <span className={["inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]", classes].join(" ")}>
      {communication.channel} · {communication.status}
    </span>
  );
}