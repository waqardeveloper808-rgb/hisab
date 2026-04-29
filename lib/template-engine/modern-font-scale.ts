/**
 * Modern template (`data-style="modern"`) uses a uniform −2px delta on font-size
 * tokens versus Standard/Compact so preview, Studio canvas, and PDF stay aligned.
 *
 * Keep `[data-wsv2] .wsv2-doc-paper-inner[data-style="modern"]` rules in
 * `app/workspace/workspace.css` numerically consistent with this constant.
 */
export const MODERN_FONT_SIZE_DELTA_PX = 2;

/** Subtract delta; clamp so body text never collapses illegibly. */
export function modernAdjustedFontPx(px: number, minPx = 6): number {
  const next = px - MODERN_FONT_SIZE_DELTA_PX;
  return next < minPx ? minPx : next;
}
