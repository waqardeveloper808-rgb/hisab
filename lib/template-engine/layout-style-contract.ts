/**
 * Document canvas layout styles — contract for Template Studio + CSS.
 * Spec: data/workspace/template-specs.md
 */
import type { TemplateStyle } from "@/lib/workspace/document-template-schemas";

export const TEMPLATE_STYLE_OPTIONS: { value: TemplateStyle; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "modern", label: "Modern" },
  { value: "compact", label: "Compact" },
];

/** Authoritative layout tokens shared with `template-specs.md` / `workspace.css` / backend `familyChrome`. */
export const LAYOUT_STYLE_CONTRACT: Record<
  TemplateStyle,
  {
    sectionGapPx: number;
    sectionPadding: string;
    sectionRadiusPx: number;
    sectionShadow: string | null;
    headerTopAccentPx: number;
    headerGridGapPx: number;
    titleEnPx: number;
    titleArPx: number;
    bodyFontPx: number;
    bodyLinePx: number;
    tableCellPadding: string;
    tableHeaderPadding: string;
  }
> = {
  standard: {
    sectionGapPx: 12,
    sectionPadding: "12px 14px",
    sectionRadiusPx: 8,
    sectionShadow: null,
    headerTopAccentPx: 4,
    headerGridGapPx: 16,
    titleEnPx: 25,
    titleArPx: 21,
    bodyFontPx: 12,
    bodyLinePx: 16,
    tableCellPadding: "7px 6px",
    tableHeaderPadding: "8px 6px",
  },
  modern: {
    sectionGapPx: 26,
    sectionPadding: "18px 20px",
    sectionRadiusPx: 18,
    sectionShadow: "0 6px 28px rgba(15, 23, 42, 0.14)",
    headerTopAccentPx: 6,
    headerGridGapPx: 22,
    titleEnPx: 28,
    titleArPx: 23,
    bodyFontPx: 12,
    bodyLinePx: 18,
    tableCellPadding: "10px 9px",
    tableHeaderPadding: "11px 9px",
  },
  compact: {
    sectionGapPx: 4,
    sectionPadding: "7px 9px",
    sectionRadiusPx: 6,
    sectionShadow: null,
    headerTopAccentPx: 2,
    headerGridGapPx: 8,
    titleEnPx: 21,
    titleArPx: 17,
    bodyFontPx: 10,
    bodyLinePx: 13,
    tableCellPadding: "4px 5px",
    tableHeaderPadding: "4px 5px",
  },
};

export function labelForTemplateStyle(style: TemplateStyle): string {
  return TEMPLATE_STYLE_OPTIONS.find((o) => o.value === style)?.label ?? style;
}
