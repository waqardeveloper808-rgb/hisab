import Link from "next/link";

export const metadata = { title: "Workspace — Manual journals" };

export default function ManualJournalsPage() {
  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Manual journals</h1>
          <p className="wsv2-page-subtitle">
            <span className="wsv2-accounting-badge wsv2-accounting-badge--live" style={{ marginRight: 8 }}>LIVE</span>
            Manual journals are created from the <strong>Journal entries</strong> register (new entry in modal). This route is a dedicated alias for accountant navigation.
          </p>
        </div>
      </div>
      <p className="text-sm" style={{ color: "var(--wsv2-ink-subtle)" }}>
        <Link className="wsv2-btn" href="/workspace/user/journal-entries">Open journal entries</Link>
      </p>
    </div>
  );
}
