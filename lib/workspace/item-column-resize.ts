// Item table column width helpers — Template Studio drag + buildDocumentLayout + PDF.
// Prompt A4-C: caps for nowrap columns, leftover to description/remarks, no overflow.

import { PAGE_GEOMETRY, type ColumnKey, type ItemColumnSpec } from "./document-template-schemas";

/** Margins shape only — avoids importing template-ui-settings (circular with migration). */
export type MarginsLike = { leftMm?: number; rightMm?: number } | null | undefined;

export type ItemsTableTargetOptions = {
  sectionPaddingPx?: number;
  borderPx?: number;
};

export const ITEM_COLUMN_SAFETY_MIN_PX = 22;

/** Preferred per-column floors (single-line budget for nowrap where applicable). */
export const ITEM_COLUMN_MIN_PX: Record<ColumnKey, number> = {
  index: 24,
  quantity: 34,
  unit: 38,
  price: 74,
  taxableAmount: 84,
  vatRate: 36,
  vatAmount: 84,
  lineTotal: 92,
  discount: 64,
  deliveredQuantity: 42,
  pendingQuantity: 42,
  description: 160,
  remarks: 80,
};

/** Hard floors — never shrink nowrap below these. */
export const ITEM_COLUMN_HARD_MIN_PX: Record<ColumnKey, number> = {
  index: 22,
  quantity: 30,
  unit: 32,
  price: 68,
  taxableAmount: 76,
  vatRate: 32,
  vatAmount: 76,
  lineTotal: 84,
  discount: 58,
  deliveredQuantity: 38,
  pendingQuantity: 38,
  description: 100,
  remarks: 70,
};

/** Maximum width caps for nowrap columns (lineTotal ≤ 104). Wrapping cols use huge cap via itemColumnMaxPx. */
export const ITEM_COLUMN_MAX_PX: Record<ColumnKey, number> = {
  index: 30,
  quantity: 42,
  unit: 46,
  price: 86,
  taxableAmount: 96,
  vatRate: 42,
  vatAmount: 96,
  lineTotal: 104,
  discount: 76,
  deliveredQuantity: 50,
  pendingQuantity: 50,
  description: 1_000_000,
  remarks: 1_000_000,
};

/** @deprecated Narrow alias for money column budgeting. */
export const ITEM_TABLE_VALUE_COLUMN_KEY: ColumnKey = "lineTotal";
/** @deprecated */
export const ITEM_TABLE_VALUE_COLUMN_FIXED_PX = 92;
export const ITEM_TABLE_DESCRIPTION_BASE_PX = 190;
export const ITEM_TABLE_DESCRIPTION_RESPONSIVE_DEFAULT_PX = 190;
export const ITEM_TABLE_DESCRIPTION_RESPONSIVE_MIN_PX = 100;
export const ITEM_TABLE_DESCRIPTION_MAX_PX = 420;
export const ITEM_TABLE_DESCRIPTION_MIN_SHRINK_PX = 90;

export function itemColumnHardMinPx(key: ColumnKey): number {
  return ITEM_COLUMN_HARD_MIN_PX[key] ?? ITEM_COLUMN_SAFETY_MIN_PX;
}

export function itemColumnMinPx(key: ColumnKey): number {
  return ITEM_COLUMN_MIN_PX[key] ?? ITEM_COLUMN_SAFETY_MIN_PX;
}

export function itemColumnMaxPx(key: ColumnKey): number {
  if (isWrappingItemColumn(key)) return 1_000_000;
  return ITEM_COLUMN_MAX_PX[key] ?? 200;
}

/** @deprecated Alias for studio / PDF min getter. */
export function itemColumnMinWidthPx(key: ColumnKey): number {
  return itemColumnMinPx(key);
}

export function isWrappingItemColumn(key: ColumnKey): boolean {
  return key === "description" || key === "remarks";
}

export function isNoWrapItemColumn(key: ColumnKey): boolean {
  return !isWrappingItemColumn(key);
}

export function getPrintableContentWidthPx(margins?: MarginsLike): number {
  const left = margins?.leftMm ?? 10;
  const right = margins?.rightMm ?? 10;
  return Math.max(0, Math.round(PAGE_GEOMETRY.widthPx - mmToPxLocal(left) - mmToPxLocal(right)));
}

export function getItemsSectionInnerWidthPx(
  margins?: MarginsLike,
  sectionPaddingPx = 8,
  borderPx = 1,
): number {
  const printable = getPrintableContentWidthPx(margins);
  return Math.max(0, Math.round(printable - sectionPaddingPx * 2 - borderPx * 2));
}

export function getItemsTableInnerTargetPx(
  margins?: MarginsLike,
  options?: ItemsTableTargetOptions,
): number {
  const sectionPaddingPx = options?.sectionPaddingPx ?? 8;
  const borderPx = options?.borderPx ?? 1;
  const printableWidth = getPrintableContentWidthPx(margins);
  const sectionInnerWidth = getItemsSectionInnerWidthPx(margins, sectionPaddingPx, borderPx);
  return Math.max(100, Math.floor(Math.min(printableWidth, sectionInnerWidth)));
}

/** Safe fallback inner target when margins unknown (10mm + default section chrome). */
export const ITEMS_TABLE_MAX_WIDTH_PX = Math.max(
  200,
  getItemsTableInnerTargetPx(undefined, { sectionPaddingPx: 8, borderPx: 1 }),
);

export function buildMinWidthGetter(_cols: ItemColumnSpec[]): (key: ColumnKey) => number {
  void _cols;
  return itemColumnMinWidthPx;
}

function mmToPxLocal(mm: number): number {
  return (mm * 96) / 25.4;
}

function sumWidths(w: number[]): number {
  return w.reduce((a, b) => a + b, 0);
}

function clampRawForKey(k: ColumnKey, raw: number, minGetter: (key: ColumnKey) => number): number {
  const pref = minGetter(k);
  const hard = itemColumnHardMinPx(k);
  if (isNoWrapItemColumn(k)) {
    const mc = itemColumnMaxPx(k);
    const v = Number.isFinite(raw) ? Math.round(raw) : pref;
    return Math.min(mc, Math.max(hard, v));
  }
  const v = Number.isFinite(raw) ? Math.round(raw) : pref;
  return Math.max(hard, v);
}

/** Core fitter — reserved mins, caps on nowrap, slack to description then remarks, then enforce description > lineTotal width. */
export function fitItemColumnWidthsToTarget(
  keys: ColumnKey[],
  raw: number[],
  targetWidthPx: number,
  minGetter: (k: ColumnKey) => number,
): number[] {
  if (keys.length === 0) return [];

  const fallbackT = getItemsTableInnerTargetPx(undefined, { sectionPaddingPx: 8, borderPx: 1 });
  const target = Math.max(
    80,
    Math.floor(Number.isFinite(targetWidthPx) && targetWidthPx > 0 ? targetWidthPx : fallbackT),
  );

  const hard = (k: ColumnKey) => itemColumnHardMinPx(k);
  let w = keys.map((k, i) => {
    const r = raw[i];
    let clamped = clampRawForKey(k, Number.isFinite(r!) ? (r as number) : minGetter(k), minGetter);
    if (k === "lineTotal") clamped = Math.min(104, clamped);
    return Math.max(minGetter(k), clamped);
  });

  // Ensure nowrap respect max cap (may have been raised by minGetter merge)
  w = keys.map((k, i) =>
    isNoWrapItemColumn(k) ? Math.min(itemColumnMaxPx(k), Math.max(hard(k), w[i]!)) : w[i]!,
  );

  // If over target: shrink wrapping columns first toward hard min, then nowrap toward hard
  for (let pass = 0; pass < 8000 && sumWidths(w) > target; pass++) {
    const wrapCand = keys
      .map((k, i) => ({ k, i }))
      .filter(({ k, i }) => isWrappingItemColumn(k) && w[i]! > hard(k));
    if (wrapCand.length > 0) {
      wrapCand.sort((a, b) => w[b.i]! - w[a.i]!);
      w[wrapCand[0]!.i]! -= 1;
      continue;
    }
    const nw = keys
      .map((k, i) => ({ k, i }))
      .filter(({ k, i }) => isNoWrapItemColumn(k) && w[i]! > hard(k));
    if (nw.length === 0) break;
    nw.sort((a, b) => w[b.i]! - w[a.i]!);
    w[nw[0]!.i]! -= 1;
  }

  // If under target: allocate slack to description then remarks
  let slack = target - sumWidths(w);
  const descI = keys.indexOf("description");
  const remI = keys.indexOf("remarks");
  while (slack > 0) {
    let advanced = false;
    if (descI >= 0) {
      w[descI]! += 1;
      slack -= 1;
      advanced = true;
    } else if (remI >= 0) {
      w[remI]! += 1;
      slack -= 1;
      advanced = true;
    } else break;
    if (!advanced) break;
  }

  w = finalizeUnderTarget(keys, w, target, minGetter, hard);

  // Extra slack after finalize: still under target
  slack = target - sumWidths(w);
  while (slack > 0) {
    if (descI >= 0) w[descI]! += 1;
    else if (remI >= 0) w[remI]! += 1;
    else break;
    slack -= 1;
  }

  // Enforce: description wider than lineTotal when both exist (steal from Total down to hard, then other nowrap)
  w = enforceDescriptionWiderThanTotal(keys, w, target, hard, minGetter);

  w = finalizeUnderTarget(keys, w, target, minGetter, hard);
  w = keys.map((_, i) => Math.max(1, Math.round(w[i]!)));

  if (sumWidths(w) > target) {
    w = keys.map((k, i) =>
      isWrappingItemColumn(k) ? Math.max(hard(k), w[i]!) : Math.min(itemColumnMaxPx(k), Math.max(hard(k), w[i]!)),
    );
    w = finalizeUnderTarget(keys, w, target, minGetter, hard);
  }

  return keys.map((_, i) => Math.max(1, Math.round(w[i]!)));
}

function finalizeUnderTarget(
  keys: ColumnKey[],
  w: number[],
  target: number,
  minGetter: (k: ColumnKey) => number,
  hard: (k: ColumnKey) => number,
): number[] {
  let ww = keys.map((k, i) =>
    isNoWrapItemColumn(k)
      ? Math.min(itemColumnMaxPx(k), Math.max(hard(k), Math.round(w[i]!)))
      : Math.max(hard(k), Math.round(w[i]!)),
  );
  let guard = 0;
  while (sumWidths(ww) > target && guard < 8000) {
    const wrapCand = keys
      .map((k, i) => ({ k, i }))
      .filter(({ k, i }) => isWrappingItemColumn(k) && ww[i]! > hard(k));
    if (wrapCand.length > 0) {
      wrapCand.sort((a, b) => ww[b.i]! - ww[a.i]!);
      ww[wrapCand[0]!.i]! -= 1;
    } else {
      const nw = keys
        .map((k, i) => ({ k, i }))
        .filter(({ k, i }) => isNoWrapItemColumn(k) && ww[i]! > hard(k));
      if (nw.length === 0) break;
      nw.sort((a, b) => ww[b.i]! - ww[a.i]!);
      ww[nw[0]!.i]! -= 1;
    }
    guard++;
  }
  // Re-apply floors and caps
  return keys.map((k, i) =>
    isNoWrapItemColumn(k)
      ? Math.min(itemColumnMaxPx(k), Math.max(hard(k), Math.max(minGetter(k), ww[i]!)))
      : Math.max(hard(k), Math.max(minGetter(k), ww[i]!)),
  );
}

function enforceDescriptionWiderThanTotal(
  keys: ColumnKey[],
  w: number[],
  target: number,
  hard: (k: ColumnKey) => number,
  minGetter: (k: ColumnKey) => number,
): number[] {
  const di = keys.indexOf("description");
  const ti = keys.indexOf("lineTotal");
  if (di < 0 || ti < 0) return w;
  let ww = [...w];
  let guard = 0;
  while (ww[di]! <= ww[ti]! && guard < 4000) {
    if (ww[ti]! > hard(keys[ti]!)) {
      ww[ti]! -= 1;
      ww[di]! += 1;
    } else {
      // Steal from widest nowrap except index
      let best = -1;
      let bestW = -1;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i]!;
        if (!isNoWrapItemColumn(k) || k === "index") continue;
        if (ww[i]! > bestW && ww[i]! > hard(k)) {
          bestW = ww[i]!;
          best = i;
        }
      }
      if (best < 0) break;
      ww[best]! -= 1;
      ww[di]! += 1;
    }
    guard++;
    if (sumWidths(ww) > target) break;
  }
  if (sumWidths(ww) > target) {
    return finalizeUnderTarget(keys, ww, target, minGetter, hard);
  }
  return ww;
}

export function sanitizeItemColumnWidthRecord(
  keys: ColumnKey[],
  record: Partial<Record<ColumnKey, number>> | undefined,
  targetWidthPx: number,
): Partial<Record<ColumnKey, number>> {
  if (keys.length === 0) return {};
  const target = Math.floor(
    Number.isFinite(targetWidthPx) && targetWidthPx > 0
      ? targetWidthPx
      : getItemsTableInnerTargetPx(undefined, { sectionPaddingPx: 8, borderPx: 1 }),
  );
  const raw = keys.map((k) => {
    const v = record?.[k];
    let px: number;
    if (v != null && Number.isFinite(v) && v > 0) px = Math.round(v as number);
    else px = itemColumnMinPx(k);
    if (k === "lineTotal") px = Math.min(104, px);
    return px;
  });
  const fitted = fitItemColumnWidthsToTarget(keys, raw, target, itemColumnMinPx);
  const out: Partial<Record<ColumnKey, number>> = {};
  keys.forEach((k, i) => {
    out[k] = fitted[i]!;
  });
  return out;
}

export function fitWidthsWithLockedColumn(
  keys: ColumnKey[],
  currentWidths: number[],
  lockedIndex: number,
  lockedWidthPx: number,
  targetWidthPx: number,
): number[] {
  const target = Math.max(80, Math.floor(targetWidthPx));
  const n = keys.length;
  if (n === 0) return currentWidths;
  if (lockedIndex < 0 || lockedIndex >= n) {
    return fitItemColumnWidthsToTarget(
      keys,
      currentWidths.slice(0, n),
      target,
      itemColumnMinPx,
    );
  }

  const kLock = keys[lockedIndex]!;
  let lockW = Math.round(lockedWidthPx);

  if (isNoWrapItemColumn(kLock)) {
    lockW = Math.min(itemColumnMaxPx(kLock), Math.max(itemColumnHardMinPx(kLock), lockW));
  } else {
    lockW = Math.max(itemColumnHardMinPx(kLock), lockW);
  }

  const otherIdx = keys.map((_, i) => i).filter((i) => i !== lockedIndex);
  const othersMin = otherIdx.reduce((s, i) => s + itemColumnHardMinPx(keys[i]!), 0);
  const maxLockByOthers = target - othersMin;
  lockW = Math.min(lockW, Math.max(itemColumnHardMinPx(kLock), maxLockByOthers));

  const remaining = target - lockW;
  if (remaining < 0) {
    return fitItemColumnWidthsToTarget(keys, currentWidths.slice(0, n), target, itemColumnMinPx);
  }

  const subKeys = otherIdx.map((i) => keys[i]!);
  const subRaw = otherIdx.map((i) => {
    const v = currentWidths[i];
    return Number.isFinite(v) ? v! : itemColumnMinPx(keys[i]!);
  });
  const subFitted = fitItemColumnWidthsToTarget(subKeys, subRaw, remaining, itemColumnMinPx);

  const out = new Array<number>(n);
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (i === lockedIndex) out[i] = lockW;
    else out[i] = subFitted[j++]!;
  }

  return fitItemColumnWidthsToTarget(keys, out, target, itemColumnMinPx);
}

export function applyBoundaryDragPx(
  keys: ColumnKey[],
  widths: number[],
  rightIndex: number,
  delta: number,
  targetWidthPx: number,
): number[] {
  if (rightIndex < 1 || rightIndex >= keys.length) return widths;
  const target = Math.floor(targetWidthPx);
  if (!Number.isFinite(target) || target < 80) {
    return fitItemColumnWidthsToTarget(
      keys,
      widths,
      getItemsTableInnerTargetPx(undefined, { sectionPaddingPx: 8, borderPx: 1 }),
      itemColumnMinPx,
    );
  }

  const clampW = (idx: number, x: number): number => {
    const k = keys[idx]!;
    const h = itemColumnHardMinPx(k);
    if (isNoWrapItemColumn(k)) {
      return Math.min(itemColumnMaxPx(k), Math.max(h, Math.round(x)));
    }
    return Math.max(h, Math.round(x));
  };

  let w = widths.map((x, i) => clampW(i, x));
  const i = rightIndex - 1;
  const j = rightIndex;
  const desiredLeft = clampW(i, w[i]! + delta);
  const desiredRight = w[j]! + (w[i]! - desiredLeft);
  w[i] = desiredLeft;
  w[j] = clampW(j, desiredRight);
  return fitItemColumnWidthsToTarget(keys, w, target, itemColumnMinPx);
}

export function computeResponsiveDescriptionWidthPx(
  visibleColumnKeys: ColumnKey[],
  margins?: MarginsLike,
  options?: ItemsTableTargetOptions,
): number {
  const target = getItemsTableInnerTargetPx(margins, options);
  const reserved = visibleColumnKeys
    .filter((k) => isNoWrapItemColumn(k))
    .reduce((s, k) => s + itemColumnMinPx(k), 0);
  return Math.max(ITEM_TABLE_DESCRIPTION_MIN_SHRINK_PX, Math.round(target - reserved));
}

export function widthsArrayToRecord(keys: ColumnKey[], widths: number[]): Partial<Record<ColumnKey, number>> {
  const o: Partial<Record<ColumnKey, number>> = {};
  keys.forEach((k, i) => {
    o[k] = Math.round(widths[i]! * 100) / 100;
  });
  return o;
}

/** @deprecated — use {@link fitItemColumnWidthsToTarget} */
export function normalizeWidthsToTableMax(keys: ColumnKey[], raw: number[]): number[] {
  return fitItemColumnWidthsToTarget(keys, raw, ITEMS_TABLE_MAX_WIDTH_PX, itemColumnMinWidthPx);
}

export function fitRawWidthsToTarget(
  keys: ColumnKey[],
  raw: number[],
  target: number,
  minGetter: (k: ColumnKey) => number,
): number[] {
  return fitItemColumnWidthsToTarget(keys, raw, target, minGetter);
}

export function roundWidthsToTarget(
  keys: ColumnKey[],
  widths: number[],
  target: number,
  minGetter: (key: ColumnKey) => number,
): number[] {
  return fitItemColumnWidthsToTarget(keys, widths, Math.floor(target), minGetter);
}
