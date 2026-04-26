"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, SlidersHorizontal } from "lucide-react";

export type ColumnDef = {
  id: string;
  label: string;
  required?: boolean;
};

type Props = {
  columns: ColumnDef[];
  visibleIds: string[];
  onChange: (next: string[]) => void;
};

export function WorkspaceV2ColumnPicker({ columns, visibleIds, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const setVisible = (id: string, nextOn: boolean) => {
    const def = columns.find((c) => c.id === id);
    if (def?.required && !nextOn) return;
    const set = new Set(visibleIds);
    if (nextOn) set.add(id);
    else set.delete(id);
    onChange(columns.filter((c) => set.has(c.id)).map((c) => c.id));
  };

  return (
    <div className="wsv2-col-picker" ref={ref}>
      <button
        type="button"
        className="wsv2-icon-btn"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        <SlidersHorizontal size={13} /> Edit columns
      </button>
      {open ? (
        <div className="wsv2-col-picker-menu" role="listbox" aria-label="Column visibility">
          {columns.map((col) => {
            const isOn = visibleIds.includes(col.id);
            const lock = col.required;
            return (
              <button
                key={col.id}
                type="button"
                role="option"
                aria-selected={isOn}
                className="wsv2-col-picker-row"
                disabled={lock && isOn}
                title={lock ? "Required column" : undefined}
                onClick={() => setVisible(col.id, !isOn)}
              >
                {isOn ? <Eye size={14} /> : <EyeOff size={14} className="wsv2-col-picker-off" />}
                <span>{col.label}</span>
                {lock ? <span className="wsv2-col-picker-lock">Required</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
