// Item table column width helpers — Template Studio drag + buildDocumentLayout + PDF.
// Hard constraint: sum(widths) <= ITEMS_TABLE_MAX_WIDTH_PX always; min column 40px.

import { PAGE_GEOMETRY, type ColumnKey, type ItemColumnSpec } from "./document-template-schemas";
import { mmToPx, type TemplateMargins } from "./template-ui-settings";

/** Card / table hard max width (px) — matches printable content width minus padding. */
export const ITEMS_TABLE_MAX_WIDTH_PX = Math.max(400, Math.round(PAGE_GEOMETRY.safeWidthPx - 16));

/** Single safety floor for every column (per product spec). */
export const ITEM_COLUMN_SAFETY_MIN_PX = 40;

/** Line monetary value column (UI label "Total" / line total). */
export const ITEM_TABLE_VALUE_COLUMN_KEY: ColumnKey = "lineTotal";
/** @deprecated Use {@link ITEMS_TABLE_MAX_WIDTH_PX} budget. */
export const ITEM_TABLE_VALUE_COLUMN_FIXED_PX = 225;
export const ITEM_TABLE_DESCRIPTION_BASE_PX = 225;
export const ITEM_TABLE_DESCRIPTION_RESPONSIVE_DEFAULT_PX = 225;
export const ITEM_TABLE_DESCRIPTION_RESPONSIVE_MIN_PX = 150;
export const ITEM_TABLE_DESCRIPTION_MAX_PX = 420;
export const ITEM_TABLE_DESCRIPTION_MIN_SHRINK_PX = 100;

/** @deprecated All keys use {@link ITEM_COLUMN_SAFETY_MIN_PX}. */
export const ITEM_COLUMN_MIN_PX: Record<ColumnKey, number> = {
  index: ITEM_COLUMN_SAFETY_MIN_PX,
  description: ITEM_COLUMN_SAFETY_MIN_PX,
  quantity: ITEM_COLUMN_SAFETY_MIN_PX,
  unit: ITEM_COLUMN_SAFETY_MIN_PX,
  price: ITEM_COLUMN_SAFETY_MIN_PX,
  taxableAmount: ITEM_COLUMN_SAFETY_MIN_PX,
  vatRate: ITEM_COLUMN_SAFETY_MIN_PX,
  vatAmount: ITEM_COLUMN_SAFETY_MIN_PX,
  lineTotal: ITEM_COLUMN_SAFETY_MIN_PX,
  deliveredQuantity: ITEM_COLUMN_SAFETY_MIN_PX,
  pendingQuantity: ITEM_COLUMN_SAFETY_MIN_PX,
  remarks: ITEM_COLUMN_SAFETY_MIN_PX,
  discount: ITEM_COLUMN_SAFETY_MIN_PX,
};

/** @deprecated Use {@link ITEM_COLUMN_SAFETY_MIN_PX}. */
export const ITEM_COLUMN_HARD_MIN_PX: Record<ColumnKey, number> = {
  index: ITEM_COLUMN_SAFETY_MIN_PX,
  description: ITEM_COLUMN_SAFETY_MIN_PX,
  quantity: ITEM_COLUMN_SAFETY_MIN_PX,
  unit: ITEM_COLUMN_SAFETY_MIN_PX,
  price: ITEM_COLUMN_SAFETY_MIN_PX,
  taxableAmount: ITEM_COLUMN_SAFETY_MIN_PX,
  vatRate: ITEM_COLUMN_SAFETY_MIN_PX,
  vatAmount: ITEM_COLUMN_SAFETY_MIN_PX,
  lineTotal: ITEM_COLUMN_SAFETY_MIN_PX,
  deliveredQuantity: ITEM_COLUMN_SAFETY_MIN_PX,
  pendingQuantity: ITEM_COLUMN_SAFETY_MIN_PX,
  remarks: ITEM_COLUMN_SAFETY_MIN_PX,
  discount: ITEM_COLUMN_SAFETY_MIN_PX,
};

export function itemColumnMinPx(_key: ColumnKey): number {
  return ITEM_COLUMN_SAFETY_MIN_PX;
}

/**
 * Printable content width (px) for A4 after left/right page margins — informational only.
 * Items table budget is {@link ITEMS_TABLE_MAX_WIDTH_PX}.
 */
export function getPrintableContentWidthPx(margins?: TemplateMargins | null): number {
  const left = margins?.leftMm ?? 10;
  const right = margins?.rightMm ?? 10;
  return Math.max(0, Math.round(PAGE_GEOMETRY.widthPx - mmToPx(left) - mmToPx(right)));
}

/**
 * Hard items-table width budget — fixed 580px (card max). Preview, layout builder, and PDF use the same cap.
 */
export function getItemsTableInnerTargetPx(_margins?: TemplateMargins | null): number {
  void _margins;
  return ITEMS_TABLE_MAX_WIDTH_PX;
}

export function buildMinWidthGetter(_cols: ItemColumnSpec[]): (key: ColumnKey) => number {
  void _cols;
  return itemColumnMinPx;
}

/**
 * Phase 2–3: clamp mins, then if sum > TABLE_MAX scale all columns proportionally; iterate until sum <= max.
 */
export function normalizeWidthsToTableMax(keys: ColumnKey[], raw: number[]): number[] {
  if (keys.length === 0) return raw;
  const n = keys.length;
  const minTotal = n * ITEM_COLUMN_SAFETY_MIN_PX;
  if (minTotal > ITEMS_TABLE_MAX_WIDTH_PX) {
    return keys.map(() => ITEM_COLUMN_SAFETY_MIN_PX);
  }
  let w = keys.map((_, i) => Math.max(ITEM_COLUMN_SAFETY_MIN_PX, Math.round(raw[i] ?? 0)));
  let sum = w.reduce((a, b) => a + b, 0);
  if (sum <= ITEMS_TABLE_MAX_WIDTH_PX) return w;

  let guard = 0;
  while (sum > ITEMS_TABLE_MAX_WIDTH_PX && guard < 64) {
    const scale = ITEMS_TABLE_MAX_WIDTH_PX / sum;
    w = w.map((x) => Math.max(ITEM_COLUMN_SAFETY_MIN_PX, x * scale));
    w = w.map((x) => Math.round(x));
    sum = w.reduce((a, b) => a + b, 0);
    if (sum <= ITEMS_TABLE_MAX_WIDTH_PX) break;
    const excess = sum - ITEMS_TABLE_MAX_WIDTH_PX;
    const flex = w.map((x) => Math.max(0, x - ITEM_COLUMN_SAFETY_MIN_PX));
    const flexSum = flex.reduce((a, b) => a + b, 0);
    if (flexSum <= 0) break;
    w = w.map((x, i) =>
      Math.max(ITEM_COLUMN_SAFETY_MIN_PX, Math.floor(x - (flex[i]! / flexSum) * excess)),
    );
    sum = w.reduce((a, b) => a + b, 0);
    guard++;
  }
  return w;
}

/**
 * Phase 4: user sets one column — keep it (clamped to min), shrink *other* columns proportionally if over budget.
 */
export function fitWidthsWithLockedColumn(
  keys: ColumnKey[],
  current: number[],
  lockedIndex: number,
  lockedWidthPx: number,
): number[] {
  const n = keys.length;
  if (n === 0) return current;
  const w = keys.map((_, i) => Math.max(ITEM_COLUMN_SAFETY_MIN_PX, Math.round(current[i] ?? 0)));
  w[lockedIndex] = Math.max(ITEM_COLUMN_SAFETY_MIN_PX, Math.round(lockedWidthPx));
  const otherIdx = keys.map((_, i) => i).filter((i) => i !== lockedIndex);
  const maxOthers = ITEMS_TABLE_MAX_WIDTH_PX - w[lockedIndex]!;
  const minOthers = otherIdx.length * ITEM_COLUMN_SAFETY_MIN_PX;
  if (maxOthers < minOthers) {
    w[lockedIndex] = ITEMS_TABLE_MAX_WIDTH_PX - minOthers;
    for (const i of otherIdx) w[i] = ITEM_COLUMN_SAFETY_MIN_PX;
    return w;
  }
  let othersSum = 0;
  for (const i of otherIdx) othersSum += w[i]!;
  if (othersSum <= maxOthers) return w;
  const scale = maxOthers / othersSum;
  for (const i of otherIdx) {
    w[i] = Math.max(ITEM_COLUMN_SAFETY_MIN_PX, Math.round(w[i]! * scale));
  }
  let sum = w.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (sum > ITEMS_TABLE_MAX_WIDTH_PX && guard < 5000) {
    const excess = sum - ITEMS_TABLE_MAX_WIDTH_PX;
    const flex = w.map((x, i) => (i === lockedIndex ? 0 : Math.max(0, x - ITEM_COLUMN_SAFETY_MIN_PX)));
    const flexSum = flex.reduce((a, b) => a + b, 0);
    if (flexSum <= 0) break;
    for (let i = 0; i < n; i++) {
      if (i === lockedIndex) continue;
      w[i] = Math.max(ITEM_COLUMN_SAFETY_MIN_PX, Math.floor(w[i]! - (flex[i]! / flexSum) * excess));
    }
    sum = w.reduce((a, b) => a + b, 0);
    guard++;
  }
  return w;
}

/**
 * Drag handle between columns `rightIndex-1` and `rightIndex`: redistribute pair, then normalize whole table to max.
 */
export function applyBoundaryDragPx(
  keys: ColumnKey[],
  widths: number[],
  rightIndex: number,
  delta: number,
): number[] {
  const MIN = ITEM_COLUMN_SAFETY_MIN_PX;
  if (rightIndex < 1 || rightIndex >= keys.length) return widths;
  const w = [...widths];
  const i = rightIndex - 1;
  const j = rightIndex;
  const pair = w[i]! + w[j]!;
  if (pair <= MIN * 2) return normalizeWidthsToTableMax(keys, w);
  let a = w[i]! + delta;
  a = Math.max(MIN, Math.min(pair - MIN, a));
  w[i] = Math.round(a);
  w[j] = Math.round(pair - w[i]!);
  return normalizeWidthsToTableMax(keys, w);
}

export function computeResponsiveDescriptionWidthPx(visibleColumnKeys: ColumnKey[]): number {
  const hasUnit = visibleColumnKeys.includes("unit");
  const hasVatRate = visibleColumnKeys.includes("vatRate");
  const hi = ITEM_TABLE_DESCRIPTION_RESPONSIVE_DEFAULT_PX;
  const lo = ITEM_TABLE_DESCRIPTION_RESPONSIVE_MIN_PX;
  if (!hasUnit && !hasVatRate) return hi;
  if (hasUnit && hasVatRate) return lo;
  return Math.round(hi - (hi - lo) / 2);
}

export function widthsArrayToRecord(keys: ColumnKey[], widths: number[]): Partial<Record<ColumnKey, number>> {
  const o: Partial<Record<ColumnKey, number>> = {};
  keys.forEach((k, i) => {
    o[k] = Math.round(widths[i]! * 100) / 100;
  });
  return o;
}

export function fitRawWidthsToTarget(
  keys: ColumnKey[],
  raw: number[],
  _target: number,
  _minGetter: (k: ColumnKey) => number,
): number[] {
  void _target;
  void _minGetter;
  return normalizeWidthsToTableMax(keys, raw);
}

/** Normalizes to {@link ITEMS_TABLE_MAX_WIDTH_PX}; `_target` and `_minGetter` are ignored (legacy signature). */
export function fitItemColumnWidthsToTarget(
  keys: ColumnKey[],
  raw: number[],
  _target: number,
  _minGetter: (k: ColumnKey) => number,
): number[] {
  void _target;
  void _minGetter;
  return normalizeWidthsToTableMax(keys, raw);
}

export function roundWidthsToTarget(
  keys: ColumnKey[],
  widths: number[],
  _target: number,
  _minGetter: (key: ColumnKey) => number,
): number[] {
  void _target;
  void _minGetter;
  return normalizeWidthsToTableMax(keys, widths);
}
