/**
 * Document canvas only — bidi helpers for preview markup (no React type import;
 * safe for Node/PDF bundles that only re-use `containsArabic`).
 */

import { containsArabic } from "./arabic-pdf-text";

export { containsArabic };

/** True when the string should use Arabic typography / RTL block behavior. */
export function isPrimarilyArabicBlock(s: string | undefined | null): boolean {
  if (!s || !s.trim()) return false;
  return containsArabic(s);
}

export type DocumentBidiCss = Record<string, string | number>;

/** RTL + right alignment + plaintext bidi (matches spec; avoids full-line reorder hacks). */
export function rtlPlaintextBlockStyle(align: "left" | "right" | "center" = "right"): DocumentBidiCss {
  const textAlign = align === "left" ? "left" : align === "center" ? "center" : "right";
  return {
    direction: "rtl",
    textAlign,
    unicodeBidi: "plaintext",
  };
}

/** Isolate Latin digits / email so they stay readable inside an RTL Arabic line. */
export function ltrIsolateStyle(): DocumentBidiCss {
  return { direction: "ltr", unicodeBidi: "isolate" };
}
