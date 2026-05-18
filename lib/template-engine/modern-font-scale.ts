/**
 * Modern sizing is driven by `LAYOUT_STYLE_CONTRACT`, `workspace.css`, and title UI
 * tokens — not a global shrink factor. Delta stays **0** so Modern remains
 * spacious per `data/workspace/template-specs.md`.
 */
export const MODERN_FONT_SIZE_DELTA_PX = 0;

/** Identity when delta is 0; kept for call-site stability / PDF parity hooks. */
export function modernAdjustedFontPx(px: number, minPx = 6): number {
  const next = px - MODERN_FONT_SIZE_DELTA_PX;
  return next < minPx ? minPx : next;
}
