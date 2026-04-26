// Prepare Arabic for pdf-lib: presentation forms + LTR visual order (TTf draws L→R).

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ArabicReshaper: { convertArabic: (s: string) => string } = require("arabic-reshaper");

const AR_RANGE = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF\u0750-\u077F]/;

export function containsArabic(s: string): boolean {
  return AR_RANGE.test(s);
}

/**
 * Presentation forms for Arabic in an LTR `drawText` run (Noto Naskh embedded).
 * Do not reverse the string — reshaping is sufficient for correct glyph order in pdf-lib.
 */
export function shapeArabicForPdf(s: string): string {
  if (!s) return "";
  return ArabicReshaper.convertArabic(s);
}

/** Split a line into LTR and RTL runs; returns segments with direction tag. */
export function segmentForPdf(s: string): { text: string; ar: boolean }[] {
  if (!s) return [];
  const out: { text: string; ar: boolean }[] = [];
  let buf = "";
  let mode: "ar" | "en" | null = null;
  for (const ch of s) {
    const isAr = AR_RANGE.test(ch) || ch === "،" || ch === "؟";
    const m: "ar" | "en" = isAr ? "ar" : "en";
    if (mode === null) {
      mode = m;
      buf = ch;
    } else if (m === mode) {
      buf += ch;
    } else {
      out.push({ text: buf, ar: mode === "ar" });
      buf = ch;
      mode = m;
    }
  }
  if (buf) out.push({ text: buf, ar: mode === "ar" });
  return out;
}
