"use client";

import type { ReactNode } from "react";
import { Filter, Plus, Search, SlidersHorizontal } from "lucide-react";
import type { DocumentStatus } from "@/lib/workspace/types";
import { statusLabel } from "@/lib/workspace/format";

export type StatusFilterOption = {
  id: "all" | DocumentStatus;
  label: string;
  count?: number;
};

type Props = {
  search: string;
  onSearchChange: (next: string) => void;
  statusFilter: "all" | DocumentStatus;
  onStatusChange: (next: "all" | DocumentStatus) => void;
  statusOptions: StatusFilterOption[];
  totalShown: number;
  totalAll: number;
  onCreate?: () => void;
  createLabel?: string;
  /** Optional "Edit columns" control (e.g. <WorkspaceColumnPicker />) */
  columnPicker?: ReactNode;
  /** @deprecated use columnPicker */
  onToggleColumns?: () => void;
};

export function WorkspaceRegisterToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  totalShown,
  totalAll,
  onCreate,
  createLabel = "New document",
  columnPicker,
  onToggleColumns,
}: Props) {
  return (
    <div className="wsv2-toolbar">
      <label className="wsv2-toolbar-search" aria-label="Search register">
        <Search size={14} color="var(--wsv2-ink-subtle)" />
        <input
          type="search"
          placeholder="Search by number or customer"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <button type="button" className="wsv2-toolbar-filter" data-active={statusFilter !== "all" ? "true" : "false"}>
        <Filter size={13} />
        Status
      </button>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {statusOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className="wsv2-toolbar-filter"
            data-active={option.id === statusFilter ? "true" : "false"}
            onClick={() => onStatusChange(option.id)}
          >
            {option.id === "all" ? "All" : statusLabel(option.id)}
            {typeof option.count === "number" ? (
              <span style={{ marginLeft: 4, color: "var(--wsv2-ink-subtle)" }}>{option.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11.5, color: "var(--wsv2-ink-subtle)" }}>
          {totalShown} of {totalAll}
        </span>
        {columnPicker}
        {onToggleColumns && !columnPicker ? (
          <button type="button" className="wsv2-icon-btn" onClick={onToggleColumns} aria-label="Toggle columns">
            <SlidersHorizontal size={13} /> Columns
          </button>
        ) : null}
        {onCreate ? (
          <button type="button" className="wsv2-btn" onClick={onCreate}>
            <Plus size={13} /> {createLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
