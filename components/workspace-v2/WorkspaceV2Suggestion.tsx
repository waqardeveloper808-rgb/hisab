"use client";

import { Info, Lightbulb, X } from "lucide-react";
import {
  useSuggestionDismissed,
  useSuggestionsEnabled,
} from "@/lib/workspace-v2/use-suggestions";

type Tone = "primary" | "info" | "warning";

type Props = {
  id: string;
  title: string;
  description?: string;
  tone?: Tone;
  className?: string;
  hideIfDisabled?: boolean;
};

export function WorkspaceV2Suggestion({
  id,
  title,
  description,
  tone = "primary",
  className,
  hideIfDisabled = true,
}: Props) {
  const { dismissed, dismiss } = useSuggestionDismissed(id);
  const { enabled } = useSuggestionsEnabled();

  if (dismissed) return null;
  if (hideIfDisabled && !enabled) return null;

  const Icon = tone === "info" ? Info : Lightbulb;

  return (
    <div
      className={["wsv2-suggestion", className].filter(Boolean).join(" ")}
      data-tone={tone}
      role="status"
    >
      <Icon size={14} style={{ marginTop: 1 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>{title}</div>
        {description ? (
          <div style={{ marginTop: 2, color: "var(--wsv2-ink-muted)" }}>{description}</div>
        ) : null}
      </div>
      <div className="actions">
        <button type="button" className="link" onClick={dismiss}>
          Don&apos;t show again
        </button>
        <button
          type="button"
          className="wsv2-icon-btn"
          aria-label="Dismiss suggestion"
          onClick={dismiss}
          style={{ height: 26, minWidth: 26, padding: 4 }}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
