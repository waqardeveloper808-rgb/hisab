"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useLayoutEditorSafe } from "@/components/workspace/LayoutEditorProvider";
import type { RegionMeta } from "@/lib/layout-engine";

interface EditableRegionProps {
  id: string;
  label: string;
  tag?: string;
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "aside" | "main" | "nav" | "article";
}

export function EditableRegion({ id, label, tag = "region", children, className = "", as: Component = "div" }: EditableRegionProps) {
  const editor = useLayoutEditorSafe();
  const route = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;
    const meta: RegionMeta = { id, label, tag, route };
    editor.registerRegion(meta);
    return () => editor.unregisterRegion(id);
  }, [editor, id, label, tag, route]);

  if (!editor) {
    return <Component className={className}>{children}</Component>;
  }

  const isActive = editor.active;
  const isSelected = editor.selectedRegion?.id === id;
  const style = editor.getRegionStyle(id);

  const handleClick = (e: React.MouseEvent) => {
    if (!isActive) return;
    e.stopPropagation();
    editor.selectRegion({ id, label, tag, route });
  };

  return (
    <Component
      ref={ref as React.Ref<HTMLDivElement>}
      className={[
        className,
        isActive ? "relative transition-all" : "",
        isActive && !isSelected ? "outline outline-1 outline-dashed outline-primary/20 hover:outline-primary/50" : "",
        isActive && isSelected ? "outline outline-2 outline-primary ring-2 ring-primary/10" : "",
      ].filter(Boolean).join(" ")}
      style={isActive || Object.keys(style).length > 0 ? style : undefined}
      onClick={handleClick}
      data-layout-region={id}
      data-layout-label={label}
    >
      {isActive && isSelected ? (
        <div className="pointer-events-none absolute -top-5 left-0 z-50 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
          {label}
        </div>
      ) : null}
      {children}
    </Component>
  );
}
