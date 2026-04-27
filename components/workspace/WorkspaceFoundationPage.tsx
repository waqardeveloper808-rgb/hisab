import Link from "next/link";
import { USER_WORKSPACE_BASE } from "@/lib/workspace/navigation";

const B = USER_WORKSPACE_BASE;

export function WorkspaceFoundationPage({
  title,
  status,
  description,
  nextSteps,
}: {
  title: string;
  status: "LIVE" | "PARTIAL" | "FOUNDATION";
  description: string;
  nextSteps?: string;
}) {
  const badge =
    status === "LIVE"
      ? "wsv2-accounting-badge wsv2-accounting-badge--live"
      : status === "PARTIAL"
        ? "wsv2-accounting-badge wsv2-accounting-badge--partial"
        : "wsv2-accounting-badge wsv2-accounting-badge--foundation";
  return (
    <div className="wsv2-page-header">
      <div style={{ maxWidth: 40 * 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <h1 className="wsv2-page-title" style={{ margin: 0 }}>{title}</h1>
          <span className={badge}>{status}</span>
        </div>
        <p className="wsv2-page-subtitle" style={{ marginTop: 4 }}>{description}</p>
        {nextSteps ? <p style={{ fontSize: 12, color: "var(--wsv2-ink-subtle)", marginTop: 8 }}>{nextSteps}</p> : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <Link href={`${B}/accounting`} className="wsv2-btn">Accounting hub</Link>
          <Link href={`${B}/journal-entries`} className="wsv2-btn-secondary">Journal entries</Link>
        </div>
      </div>
    </div>
  );
}
