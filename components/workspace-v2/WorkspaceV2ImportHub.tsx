"use client";

import { FileUp } from "lucide-react";
import { WorkspaceV2Suggestion } from "./WorkspaceV2Suggestion";

export function WorkspaceV2ImportHub() {
  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">Import</h1>
          <p className="wsv2-page-subtitle">Bring contacts, items, or opening balances in when the import engine is connected.</p>
        </div>
        <div className="wsv2-page-actions">
          <button type="button" className="wsv2-btn" disabled title="Not connected to import service">
            <FileUp size={13} />
            Import file
          </button>
        </div>
      </div>
      <WorkspaceV2Suggestion
        id="import-preview"
        tone="warning"
        title="Preview module — workflow not connected yet"
        description="You are on a real /import route. File parsing and validation are not available in this V2 build."
      />
      <div className="wsv2-card" style={{ marginTop: 14, padding: 24, color: "var(--wsv2-ink-subtle)", fontSize: 13, lineHeight: 1.7 }}>
        <p style={{ margin: 0, marginBottom: 12 }}>Planned importers: contacts (CSV), items (XLSX), opening balances, bank statements.</p>
        <p style={{ margin: 0 }}>The legacy workspace import is unchanged — this is the V2 surface only.</p>
      </div>
    </div>
  );
}
