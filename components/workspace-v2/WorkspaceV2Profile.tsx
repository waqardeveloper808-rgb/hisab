"use client";

import { useState } from "react";
import { useSuggestionsEnabled } from "@/lib/workspace-v2/use-suggestions";
import { clearAllDismissed } from "@/lib/workspace-v2/suggestions";
import { WorkspaceV2Suggestion } from "./WorkspaceV2Suggestion";

export function WorkspaceV2Profile() {
  const { enabled, setEnabled } = useSuggestionsEnabled();
  const [name, setName] = useState("Mariam Al-Saleh");
  const [email, setEmail] = useState("mariam@saharabusiness.sa");
  const [language, setLanguage] = useState<"english" | "arabic">("english");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [productNotifs, setProductNotifs] = useState(false);

  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">User profile</h1>
          <p className="wsv2-page-subtitle">
            Identity, language preference, and how the workspace communicates with you.
          </p>
        </div>
      </div>

      <WorkspaceV2Suggestion
        id="profile-readonly"
        tone="info"
        title="Preview mode"
        description="Profile fields can be edited locally for review. Sign in to save changes to your real workspace."
      />

      <div className="wsv2-grid wsv2-grid-cols-2" style={{ marginTop: 14 }}>
        <section className="wsv2-card wsv2-card-tight" aria-label="Identity">
          <h2 className="wsv2-card-title">Identity</h2>
          <p className="wsv2-card-subtitle">Used in document audit history and notifications.</p>
          <div className="wsv2-form-row" style={{ marginTop: 12 }}>
            <div className="wsv2-form-field">
              <label>Display name</label>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="wsv2-form-field">
              <label>Email</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="wsv2-form-field">
              <label>Role</label>
              <input value="Workspace owner" disabled />
            </div>
            <div className="wsv2-form-field">
              <label>Language</label>
              <select value={language} onChange={(event) => setLanguage(event.target.value as "english" | "arabic")}>
                <option value="english">English</option>
                <option value="arabic">العربية (Arabic)</option>
              </select>
            </div>
          </div>
        </section>

        <section className="wsv2-card wsv2-card-tight" aria-label="Notification preferences">
          <h2 className="wsv2-card-title">Notification preferences</h2>
          <p className="wsv2-card-subtitle">Pick where the workspace can reach you.</p>
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            <ToggleRow
              label="Email — overdue and payment events"
              on={emailNotifs}
              onChange={setEmailNotifs}
            />
            <ToggleRow
              label="Product updates and announcements"
              on={productNotifs}
              onChange={setProductNotifs}
            />
            <ToggleRow
              label="Show in-product suggestions"
              hint="When off, dismissible tip cards across Workspace V2 stay hidden."
              on={enabled}
              onChange={setEnabled}
            />
          </div>
          <button
            type="button"
            className="wsv2-btn-secondary wsv2-icon-btn"
            style={{ marginTop: 12 }}
            onClick={() => clearAllDismissed()}
          >
            Reset dismissed suggestions
          </button>
        </section>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div
      className="wsv2-toggle"
      style={{
        background: "var(--wsv2-surface-alt)",
        border: "1px solid var(--wsv2-line)",
        color: "var(--wsv2-ink)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500 }}>{label}</div>
        {hint ? (
          <div style={{ fontSize: 11.5, color: "var(--wsv2-ink-subtle)", marginTop: 2 }}>{hint}</div>
        ) : null}
      </div>
      <span
        role="button"
        aria-label={label}
        tabIndex={0}
        className="wsv2-toggle-switch"
        data-on={on ? "true" : "false"}
        style={{ background: on ? "var(--wsv2-primary)" : "rgba(11,11,11,0.18)" }}
        onClick={() => onChange(!on)}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") onChange(!on);
        }}
      />
    </div>
  );
}
