"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  align?: "left" | "right" | "center";
  /** Show resize handle on the right; calls back with pointer-down start X */
  onResizePointerDown?: (clientX: number) => void;
  className?: string;
  /** When set, merged onto the resize grip (e.g. `resize-handle` for journal styling). */
  resizeHandleClassName?: string;
};

export function RegisterTableHeaderCell({
  children,
  align = "left",
  onResizePointerDown,
  className = "",
  resizeHandleClassName,
}: Props) {
  return (
    <th
      className={[
        "register-table-th relative min-w-0 align-top",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        className,
      ].join(" ")}
    >
      <div className="flex min-w-0 items-start justify-between gap-1 pr-2">
        <span className="min-w-0 flex-1">{children}</span>
      </div>
      {onResizePointerDown ? (
        <span
          role="separator"
          aria-orientation="vertical"
          aria-hidden
          className={[
            "absolute right-0 top-0 z-[2] cursor-col-resize touch-none select-none",
            resizeHandleClassName ?? "h-full w-2",
          ].join(" ")}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.button !== 0) return;
            onResizePointerDown(e.clientX);
          }}
        />
      ) : null}
    </th>
  );
}
