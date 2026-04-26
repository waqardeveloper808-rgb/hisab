"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { WorkspaceV2Suggestion } from "./WorkspaceV2Suggestion";

type Props = {
  title: string;
  subtitle: string;
  primaryLabel: string;
  moduleId: string;
  children?: ReactNode;
};

/**
 * Honest V2 surface when the workflow is not connected to a backend.
 */
export function WorkspaceV2ModulePlaceholder({
  title,
  subtitle,
  primaryLabel,
  moduleId,
  children,
}: Props) {
  return (
    <div>
      <div className="wsv2-page-header">
        <div>
          <h1 className="wsv2-page-title">{title}</h1>
          <p className="wsv2-page-subtitle">{subtitle}</p>
        </div>
        <div className="wsv2-page-actions">
          <button
            type="button"
            className="wsv2-btn"
            disabled
            title="Preview module — workflow not connected yet"
          >
            <Plus size={13} />
            {primaryLabel}
          </button>
        </div>
      </div>

      <WorkspaceV2Suggestion
        id={`placeholder-${moduleId}`}
        tone="warning"
        title="Preview module — workflow not connected yet"
        description="This page is a real route with the correct title and action label. The underlying business workflow is not wired in this V2 build."
      />

      {children ? (
        <div className="wsv2-card" style={{ marginTop: 14, padding: 20 }}>
          {children}
        </div>
      ) : (
        <div
          className="wsv2-card"
          style={{ marginTop: 14, padding: 24, color: "var(--wsv2-ink-subtle)", fontSize: 13, lineHeight: 1.6 }}
        >
          When the engine is connected, this area will list records and filters for this module. Navigation and layout are
          ready.
        </div>
      )}
    </div>
  );
}
