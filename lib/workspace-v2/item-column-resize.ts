// Item table column width helpers — shared by template studio drag + buildDocumentLayout.
import { SPACING, PAGE_GEOMETRY, type ColumnKey, type ItemColumnSpec } from "./document-template-schemas";
import { mmToPx, type TemplateMargins } from "./template-ui-settings";

/**
 * Printable content width (px) for A4 after left/right page margins.
 */
export function getPrintableContentWidthPx(margins?: TemplateMargins | null): number {
  const left = margins?.leftMm ?? 10;
  const right = margins?.rightMm ?? 10;
  return Math.max(0, Math.round(PAGE_GEOMETRY.widthPx - mmToPx(left) - mmToPx(right)));
}

/**
 * Inner width of the items table inside a section card: printable width minus
 * horizontal card padding (matches `.wsv2-wf-section` `padding: … 14px`).
 */
export function getItemsTableInnerTargetPx(margins?: TemplateMargins | null): number {
  return Math.max(0, getPrintableContentWidthPx(margins) - 2 * SPACING.cardPaddingXPx);
}

/** Minimum width per column; keeps VAT / Total grabbable on narrow layouts. */
export const ITEM_COLUMN_MIN_PX: Record<ColumnKey, number> = {
  index: 22,
  description: 64,
  quantity: 28,
  unit: 24,
  price: 44,
  taxableAmount: 48,
  vatRate: 32,
  vatAmount: 44,
  lineTotal: 48,
  deliveredQuantity: 28,
  pendingQuantity: 28,
  remarks: 32,
  discount: 40,
};

function minForKey(key: ColumnKey, schemaDefault: number): number {
  const m = ITEM_COLUMN_MIN_PX[key];
  if (m != null) return m;
  return Math.max(20, Math.min(32, Math.floor(schemaDefault * 0.35)));
}

/**
 * Move delta px from col `rightIndex` to col `rightIndex-1` (drag handle between the two).
 * Preserves the sum of all widths. Clamps to per-column minima; may not apply full delta
 * if a boundary hits its minimum.
 */
export function applyBoundaryDragPx(
  keys: ColumnKey[],
  widths: number[],
  /** Index of the right column in the pair (handle between rightIndex-1 and rightIndex). */
  rightIndex: number,
  delta: number,
  minPx: (key: ColumnKey) => number,
): number[] {
  if (rightIndex < 1 || rightIndex >= keys.length) return widths;
  const w = [...widths];
  const i = rightIndex - 1;
  const j = rightIndex;
  const pair = w[i] + w[j];
  const minI = minPx(keys[i]);
  const minJ = minPx(keys[j]);
  if (pair <= minI + minJ) return w;
  let a = w[i] + delta;
  a = Math.max(minI, Math.min(pair - minJ, a));
  w[i] = Math.round(a);
  w[j] = Math.round(pair - w[i]);
  return w;
}

export function buildMinWidthGetter(cols: ItemColumnSpec[]): (key: ColumnKey) => number {
  return (key: ColumnKey) => {
    const c = cols.find((x) => x.key === key);
    return minForKey(key, c?.widthPx ?? 40);
  };
}

export function widthsArrayToRecord(keys: ColumnKey[], widths: number[]): Partial<Record<ColumnKey, number>> {
  const o: Partial<Record<ColumnKey, number>> = {};
  keys.forEach((k, i) => {
    o[k] = Math.round(widths[i]! * 100) / 100;
  });
  return o;
}

/** Rounds to integer px; fixes off-by-one vs target. Pair-drag keeps sum; this only nudges. */
/**
 * Adjusts raw pixel widths so their sum equals `target`, respecting per-column minimums.
 * Used by the inspector when a single column width changes.
 */
export function fitRawWidthsToTarget(
  keys: ColumnKey[],
  raw: number[],
  target: number,
  minGetter: (k: ColumnKey) => number,
): number[] {
  if (keys.length === 0) return raw;
  const clamped = keys.map((k, i) => Math.max(minGetter(k), Math.floor(raw[i] ?? 0)));
  const total = clamped.reduce((a, b) => a + b, 0);
  if (total <= 0) {
    const w = Math.max(minGetter(keys[0]!), Math.floor(target / keys.length));
    return keys.map((k) => Math.max(minGetter(k), w));
  }
  if (total > target) {
    const scale = target / total;
    const scaled = keys.map((k, i) =>
      Math.max(minGetter(k), Math.floor((clamped[i] ?? 0) * scale)),
    );
    let sum = scaled.reduce((a, b) => a + b, 0);
    let g = 0;
    while (sum < target && g < 3000) {
      const j = g % keys.length;
      scaled[j]! += 1;
      sum += 1;
      g += 1;
    }
    return scaled;
  }
  // total <= target — grow description (or last col) to absorb slack
  const out = [...clamped];
  let d = target - total;
  const di = keys.indexOf("description");
  const fix = di >= 0 ? di : keys.length - 1;
  let g = 0;
  while (d > 0 && g < 3000) {
    out[fix]! += 1;
    d -= 1;
    g += 1;
  }
  return out;
}

export function roundWidthsToTarget(
  keys: ColumnKey[],
  widths: number[],
  target: number,
  minGetter: (key: ColumnKey) => number,
): number[] {
  const w = widths.map((x) => Math.max(0, Math.round(x)));
  const sum0 = w.reduce((a, b) => a + b, 0);
  let d = target - sum0;
  const desc = keys.indexOf("description");
  const idx = (i: number) => (i + keys.length) % keys.length;
  let p = desc >= 0 ? desc : 0;
  let guard = 0;
  while (d !== 0 && guard < 4000) {
    const j = idx(p);
    if (d > 0) {
      w[j]! += 1;
      d -= 1;
    } else if (w[j]! > minGetter(keys[j]!)) {
      w[j]! -= 1;
      d += 1;
    } else p += 1;
    guard += 1;
  }
  return w;
}
