"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

export type MoreAction = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
};

type Props = {
  label?: string;
  actions: MoreAction[];
};

export function WorkspaceV2MoreActions({ label = "More", actions }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handle(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div className="wsv2-more-menu" ref={ref}>
      <button
        type="button"
        className="wsv2-icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <MoreHorizontal size={14} />
        <span className="sr-only">{label}</span>
      </button>
      {open ? (
        <div className="wsv2-more-menu-list" role="menu">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                action.onSelect?.();
              }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
