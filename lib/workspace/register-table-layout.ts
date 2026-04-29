"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

/** Minimum column width (px) for all register tables. */
export const REGISTER_TABLE_MIN_COL_PX = 60;

export function registerTableWidthsStorageKey(tableName: string): string {
  return `table:${tableName}:columnWidths`;
}

export function registerTableVisibilityStorageKey(tableName: string): string {
  return `table:${tableName}:columnVisibility`;
}

export function loadRegisterTableWidthsForKey(storageKey: string): Partial<Record<string, number>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Partial<Record<string, number>> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v)) {
        out[k] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function loadRegisterTableWidths(tableName: string): Partial<Record<string, number>> {
  return loadRegisterTableWidthsForKey(registerTableWidthsStorageKey(tableName));
}

export function saveRegisterTableWidthsToKey(storageKey: string, widths: Record<string, number>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(widths));
  } catch {
    /* quota */
  }
}

export function saveRegisterTableWidths(tableName: string, widths: Record<string, number>): void {
  saveRegisterTableWidthsToKey(registerTableWidthsStorageKey(tableName), widths);
}

export function loadRegisterTableVisibility<T extends string>(
  tableName: string,
  defaultVisible: T[],
): T[] {
  if (typeof window === "undefined") return defaultVisible;
  try {
    const raw = window.localStorage.getItem(registerTableVisibilityStorageKey(tableName));
    if (!raw) return defaultVisible;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultVisible;
    const allowed = new Set(defaultVisible);
    const next = parsed.filter((id): id is T => typeof id === "string" && allowed.has(id as T));
    return next.length > 0 ? next : defaultVisible;
  } catch {
    return defaultVisible;
  }
}

export function saveRegisterTableVisibility(tableName: string, visibleIds: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(registerTableVisibilityStorageKey(tableName), JSON.stringify(visibleIds));
  } catch {
    /* quota */
  }
}

export type RegisterColumnWidthDef = { id: string; defaultWidth: number };

export type UseRegisterTableLayoutOptions = {
  /** When set, column widths load/save under this key instead of `table:<tableName>:columnWidths`. */
  columnWidthsStorageKey?: string;
};

export function useRegisterTableLayout(
  tableName: string,
  defs: RegisterColumnWidthDef[],
  visibleColumnIds: string[],
  options?: UseRegisterTableLayoutOptions,
) {
  const widthsKey = options?.columnWidthsStorageKey ?? registerTableWidthsStorageKey(tableName);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);

  const defMap = useMemo(() => new Map(defs.map((d) => [d.id, d])), [defs]);

  const orderedVisibleDefs = useMemo(() => {
    return visibleColumnIds.map((id) => defMap.get(id)).filter(Boolean) as RegisterColumnWidthDef[];
  }, [defMap, visibleColumnIds]);

  const [widths, setWidths] = useState<Record<string, number>>(() => {
    const stored = loadRegisterTableWidthsForKey(widthsKey);
    const init: Record<string, number> = {};
    for (const d of defs) {
      const w = stored[d.id];
      init[d.id] = w != null && w >= REGISTER_TABLE_MIN_COL_PX ? w : d.defaultWidth;
    }
    return init;
  });

  useLayoutEffect(() => {
    setWidths((prev) => {
      const stored = loadRegisterTableWidthsForKey(widthsKey);
      const next = { ...prev };
      let changed = false;
      for (const d of defs) {
        if (next[d.id] == null || next[d.id]! < REGISTER_TABLE_MIN_COL_PX) {
          const w = stored[d.id];
          next[d.id] = w != null && w >= REGISTER_TABLE_MIN_COL_PX ? w : d.defaultWidth;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [widthsKey, defs]);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerW(el.clientWidth));
    ro.observe(el);
    setContainerW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const orderedIds = useMemo(() => orderedVisibleDefs.map((d) => d.id), [orderedVisibleDefs]);

  const baseSum = useMemo(
    () => orderedIds.reduce((s, id) => s + (widths[id] ?? REGISTER_TABLE_MIN_COL_PX), 0),
    [orderedIds, widths],
  );

  const scale = containerW > 0 && baseSum > containerW ? containerW / baseSum : 1;

  const colPercents = useMemo(() => {
    const scaled = orderedIds.map((id) => (widths[id] ?? REGISTER_TABLE_MIN_COL_PX) * scale);
    const t = scaled.reduce((a, b) => a + b, 0) || 1;
    return orderedIds.map((id, i) => ({ id, percent: (scaled[i]! / t) * 100 }));
  }, [orderedIds, widths, scale]);

  const persist = useCallback(
    (next: Record<string, number>) => {
      saveRegisterTableWidthsToKey(widthsKey, next);
    },
    [widthsKey],
  );

  const beginResizePair = useCallback(
    (leftIndex: number, startClientX: number) => {
      const leftId = orderedIds[leftIndex];
      const rightId = orderedIds[leftIndex + 1];
      if (!leftId || !rightId) return;
      const startL = widths[leftId] ?? REGISTER_TABLE_MIN_COL_PX;
      const startR = widths[rightId] ?? REGISTER_TABLE_MIN_COL_PX;
      const pairSum = startL + startR;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startClientX;
        let newL = startL + dx;
        let newR = pairSum - newL;
        if (newL < REGISTER_TABLE_MIN_COL_PX) {
          newL = REGISTER_TABLE_MIN_COL_PX;
          newR = pairSum - newL;
        }
        if (newR < REGISTER_TABLE_MIN_COL_PX) {
          newR = REGISTER_TABLE_MIN_COL_PX;
          newL = pairSum - newR;
        }
        setWidths((prev) => {
          const merged = { ...prev, [leftId]: newL, [rightId]: newR };
          persist(merged);
          return merged;
        });
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [orderedIds, widths, persist],
  );

  return { wrapRef, colPercents, orderedIds, beginResizePair };
}
