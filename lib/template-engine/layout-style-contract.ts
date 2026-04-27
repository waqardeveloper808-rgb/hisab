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

export function labelForTemplateStyle(style: TemplateStyle): string {
  return TEMPLATE_STYLE_OPTIONS.find((o) => o.value === style)?.label ?? style;
}
