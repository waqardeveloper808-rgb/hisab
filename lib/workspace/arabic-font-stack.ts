/**
 * Single Arabic typography stack for preview UI, workspace templates, and PDF/HTML shells.
 * Browser: uses next/font CSS variables from `app/layout.tsx`.
 * PDF/print HTML: uses literal webfont names (must match loaded `@font-face` / Google Fonts).
 */
export const ARABIC_FONT_STACK_CSS_VARS =
  "var(--font-noto-sans-arabic), var(--font-tajawal), var(--font-ibm-plex-sans-arabic), sans-serif";

/** Literal stack for injected HTML/Puppeteer/PDF — matches preview visually when fonts load. */
export const ARABIC_FONT_STACK_LITERAL = '"Noto Sans Arabic", "Tajawal", "IBM Plex Sans Arabic", sans-serif';
