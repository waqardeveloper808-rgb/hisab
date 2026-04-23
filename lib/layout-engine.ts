/**
 * Gulf Hisab — Layout Engine
 *
 * Persistence-aware layout override system.
 * Stores per-region CSS overrides keyed by route + regionId.
 * Persists to localStorage, restores on reload.
 */

/* ----------------------------------------------------------------
   TYPES
   ---------------------------------------------------------------- */

export type DensityPreset = "compact" | "dense" | "regular" | "comfortable" | "executive";

export interface LayoutOverride {
  /* Layout */
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  /* Spacing */
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  gap?: string;
  /* Box */
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  backgroundColor?: string;
  backgroundOpacity?: string;
  boxShadow?: string;
  /* Typography */
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  color?: string;
  textAlign?: string;
  textTransform?: string;
  /* Visibility */
  display?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  hideWhenEmpty?: boolean;
  /* Text overrides */
  textOverride?: string;
}

export interface RegionMeta {
  id: string;
  label: string;
  tag: string;
  route: string;
}

export interface LayoutPreset {
  id: string;
  name: string;
  scope: "region" | "page" | "global";
  overrides: Record<string, LayoutOverride>;
}

/* ----------------------------------------------------------------
   STORAGE KEY
   ---------------------------------------------------------------- */

const STORAGE_KEY = "gulf-hisab-layout-overrides";
const PRESETS_KEY = "gulf-hisab-layout-presets";

/* ----------------------------------------------------------------
   READ / WRITE
   ---------------------------------------------------------------- */

export function readAllOverrides(): Record<string, LayoutOverride> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeAllOverrides(overrides: Record<string, LayoutOverride>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch { /* quota exceeded — ignore */ }
}

export function getRegionKey(route: string, regionId: string): string {
  return `${route}::${regionId}`;
}

export function getOverride(route: string, regionId: string): LayoutOverride | null {
  const all = readAllOverrides();
  return all[getRegionKey(route, regionId)] ?? null;
}

export function setOverride(route: string, regionId: string, override: LayoutOverride): void {
  const all = readAllOverrides();
  const key = getRegionKey(route, regionId);
  // Merge with existing
  all[key] = { ...(all[key] ?? {}), ...override };
  // Clean empty values
  const cleaned = Object.fromEntries(
    Object.entries(all[key]).filter(([, v]) => v !== undefined && v !== "" && v !== null)
  ) as LayoutOverride;
  if (Object.keys(cleaned).length === 0) {
    delete all[key];
  } else {
    all[key] = cleaned;
  }
  writeAllOverrides(all);
}

export function resetOverride(route: string, regionId: string): void {
  const all = readAllOverrides();
  delete all[getRegionKey(route, regionId)];
  writeAllOverrides(all);
}

export function resetPageOverrides(route: string): void {
  const all = readAllOverrides();
  const prefix = `${route}::`;
  for (const key of Object.keys(all)) {
    if (key.startsWith(prefix)) delete all[key];
  }
  writeAllOverrides(all);
}

export function resetAllOverrides(): void {
  writeAllOverrides({});
}

/* ----------------------------------------------------------------
   OVERRIDE → INLINE STYLE
   ---------------------------------------------------------------- */

export function overrideToStyle(o: LayoutOverride | null): React.CSSProperties {
  if (!o) return {};
  const s: Record<string, string | undefined> = {};
  if (o.width) s.width = o.width;
  if (o.minWidth) s.minWidth = o.minWidth;
  if (o.maxWidth) s.maxWidth = o.maxWidth;
  if (o.height) s.height = o.height;
  if (o.minHeight) s.minHeight = o.minHeight;
  if (o.maxHeight) s.maxHeight = o.maxHeight;
  if (o.marginTop) s.marginTop = o.marginTop;
  if (o.marginRight) s.marginRight = o.marginRight;
  if (o.marginBottom) s.marginBottom = o.marginBottom;
  if (o.marginLeft) s.marginLeft = o.marginLeft;
  if (o.paddingTop) s.paddingTop = o.paddingTop;
  if (o.paddingRight) s.paddingRight = o.paddingRight;
  if (o.paddingBottom) s.paddingBottom = o.paddingBottom;
  if (o.paddingLeft) s.paddingLeft = o.paddingLeft;
  if (o.gap) s.gap = o.gap;
  if (o.borderRadius) s.borderRadius = o.borderRadius;
  if (o.borderWidth) s.borderWidth = o.borderWidth;
  if (o.borderColor) s.borderColor = o.borderColor;
  if (o.backgroundColor) s.backgroundColor = o.backgroundColor;
  if (o.boxShadow) s.boxShadow = o.boxShadow;
  if (o.fontSize) s.fontSize = o.fontSize;
  if (o.fontWeight) s.fontWeight = o.fontWeight;
  if (o.lineHeight) s.lineHeight = o.lineHeight;
  if (o.letterSpacing) s.letterSpacing = o.letterSpacing;
  if (o.color) s.color = o.color;
  if (o.textAlign) s.textAlign = o.textAlign;
  if (o.textTransform) s.textTransform = o.textTransform;
  if (o.display) s.display = o.display;
  return s as React.CSSProperties;
}

/* ----------------------------------------------------------------
   PRESETS
   ---------------------------------------------------------------- */

export const builtInPresets: LayoutPreset[] = [
  {
    id: "compact",
    name: "Compact",
    scope: "global",
    overrides: {
      "__global__": { paddingTop: "0.25rem", paddingBottom: "0.25rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", gap: "0.25rem", fontSize: "0.8125rem" },
    },
  },
  {
    id: "dense-pro",
    name: "Dense Professional",
    scope: "global",
    overrides: {
      "__global__": { paddingTop: "0.375rem", paddingBottom: "0.375rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", gap: "0.375rem", fontSize: "0.8125rem", borderRadius: "0.375rem" },
    },
  },
  {
    id: "regular",
    name: "Regular",
    scope: "global",
    overrides: {
      "__global__": { paddingTop: "0.5rem", paddingBottom: "0.5rem", paddingLeft: "0.75rem", paddingRight: "0.75rem", gap: "0.5rem", fontSize: "0.875rem" },
    },
  },
  {
    id: "comfortable",
    name: "Comfortable",
    scope: "global",
    overrides: {
      "__global__": { paddingTop: "0.75rem", paddingBottom: "0.75rem", paddingLeft: "1rem", paddingRight: "1rem", gap: "0.75rem", fontSize: "0.875rem" },
    },
  },
  {
    id: "executive",
    name: "Executive",
    scope: "global",
    overrides: {
      "__global__": { paddingTop: "1rem", paddingBottom: "1rem", paddingLeft: "1.25rem", paddingRight: "1.25rem", gap: "1rem", fontSize: "0.9375rem" },
    },
  },
];

export function readCustomPresets(): LayoutPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomPreset(preset: LayoutPreset): void {
  const all = readCustomPresets().filter((p) => p.id !== preset.id);
  all.push(preset);
  if (typeof window !== "undefined") {
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  }
}

export function deleteCustomPreset(id: string): void {
  const all = readCustomPresets().filter((p) => p.id !== id);
  if (typeof window !== "undefined") {
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  }
}
