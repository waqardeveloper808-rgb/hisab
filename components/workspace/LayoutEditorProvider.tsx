"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  readAllOverrides,
  setOverride,
  resetOverride,
  resetPageOverrides,
  resetAllOverrides,
  overrideToStyle,
  getRegionKey,
  builtInPresets,
  readCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
  type LayoutOverride,
  type RegionMeta,
  type LayoutPreset,
} from "@/lib/layout-engine";

/* ----------------------------------------------------------------
   CONTEXT TYPES
   ---------------------------------------------------------------- */

interface LayoutEditorState {
  active: boolean;
  setActive: (v: boolean) => void;
  selectedRegion: RegionMeta | null;
  selectRegion: (r: RegionMeta | null) => void;
  regions: Map<string, RegionMeta>;
  registerRegion: (meta: RegionMeta) => void;
  unregisterRegion: (id: string) => void;
  getRegionOverride: (regionId: string) => LayoutOverride | null;
  getRegionStyle: (regionId: string) => React.CSSProperties;
  updateOverride: (regionId: string, patch: Partial<LayoutOverride>) => void;
  resetRegion: (regionId: string) => void;
  resetPage: () => void;
  resetAll: () => void;
  overrides: Record<string, LayoutOverride>;
  presets: LayoutPreset[];
  customPresets: LayoutPreset[];
  applyPreset: (presetId: string, scope: "region" | "page" | "global") => void;
  savePreset: (name: string, scope: "region" | "page" | "global") => void;
  removePreset: (id: string) => void;
}

const LayoutEditorContext = createContext<LayoutEditorState | null>(null);

export function useLayoutEditor(): LayoutEditorState {
  const ctx = useContext(LayoutEditorContext);
  if (!ctx) throw new Error("useLayoutEditor must be used within LayoutEditorProvider");
  return ctx;
}

export function useLayoutEditorSafe(): LayoutEditorState | null {
  return useContext(LayoutEditorContext);
}

/* ----------------------------------------------------------------
   PROVIDER
   ---------------------------------------------------------------- */

export function LayoutEditorProvider({ children }: { children: ReactNode }) {
  const route = usePathname();
  const [active, setActive] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionMeta | null>(null);
  const [regions] = useState(() => new Map<string, RegionMeta>());
  const [overrides, setOverrides] = useState<Record<string, LayoutOverride>>(() => readAllOverrides());
  const [customPresets, setCustomPresets] = useState<LayoutPreset[]>(() => readCustomPresets());
  const [, forceRender] = useState(0);

  const registerRegion = useCallback((meta: RegionMeta) => {
    regions.set(meta.id, meta);
    forceRender((c) => c + 1);
  }, [regions]);

  const unregisterRegion = useCallback((id: string) => {
    regions.delete(id);
    if (selectedRegion?.id === id) setSelectedRegion(null);
    forceRender((c) => c + 1);
  }, [regions, selectedRegion]);

  const getRegionOverride = useCallback((regionId: string): LayoutOverride | null => {
    return overrides[getRegionKey(route, regionId)] ?? null;
  }, [overrides, route]);

  const getRegionStyle = useCallback((regionId: string): React.CSSProperties => {
    return overrideToStyle(overrides[getRegionKey(route, regionId)] ?? null);
  }, [overrides, route]);

  const updateOverride = useCallback((regionId: string, patch: Partial<LayoutOverride>) => {
    setOverride(route, regionId, patch as LayoutOverride);
    setOverrides(readAllOverrides());
  }, [route]);

  const resetRegionFn = useCallback((regionId: string) => {
    resetOverride(route, regionId);
    setOverrides(readAllOverrides());
  }, [route]);

  const resetPage = useCallback(() => {
    resetPageOverrides(route);
    setOverrides(readAllOverrides());
  }, [route]);

  const resetAllFn = useCallback(() => {
    resetAllOverrides();
    setOverrides({});
  }, []);

  const selectRegion = useCallback((r: RegionMeta | null) => {
    // Clear selection if the region belongs to a different route
    if (r && r.route !== route) {
      setSelectedRegion(null);
    } else {
      setSelectedRegion(r);
    }
  }, [route]);

  const applyPreset = useCallback((presetId: string, scope: "region" | "page" | "global") => {
    const preset = [...builtInPresets, ...readCustomPresets()].find((p) => p.id === presetId);
    if (!preset) return;
    const overrideValues = Object.values(preset.overrides)[0];
    if (!overrideValues) return;

    if (scope === "region" && selectedRegion) {
      setOverride(route, selectedRegion.id, overrideValues);
    } else if (scope === "page") {
      regions.forEach((_, regionId) => {
        setOverride(route, regionId, overrideValues);
      });
    } else if (scope === "global") {
      setOverride(route, "__global__", overrideValues);
    }
    setOverrides(readAllOverrides());
  }, [regions, route, selectedRegion]);

  const savePresetFn = useCallback((name: string, scope: "region" | "page" | "global") => {
    const id = `custom-${Date.now()}`;
    const capturedOverrides: Record<string, LayoutOverride> = {};
    if (scope === "region" && selectedRegion) {
      const key = getRegionKey(route, selectedRegion.id);
      if (overrides[key]) capturedOverrides[selectedRegion.id] = overrides[key];
    } else {
      const prefix = `${route}::`;
      for (const [k, v] of Object.entries(overrides)) {
        if (k.startsWith(prefix)) capturedOverrides[k.replace(prefix, "")] = v;
      }
    }
    const preset: LayoutPreset = { id, name, scope, overrides: capturedOverrides };
    saveCustomPreset(preset);
    setCustomPresets(readCustomPresets());
  }, [overrides, route, selectedRegion]);

  const removePresetFn = useCallback((id: string) => {
    deleteCustomPreset(id);
    setCustomPresets(readCustomPresets());
  }, []);

  const value = useMemo<LayoutEditorState>(() => ({
    active, setActive,
    selectedRegion, selectRegion,
    regions, registerRegion, unregisterRegion,
    getRegionOverride, getRegionStyle,
    updateOverride,
    resetRegion: resetRegionFn, resetPage, resetAll: resetAllFn,
    overrides,
    presets: builtInPresets,
    customPresets,
    applyPreset, savePreset: savePresetFn, removePreset: removePresetFn,
  }), [active, selectedRegion, selectRegion, regions, registerRegion, unregisterRegion, getRegionOverride, getRegionStyle, updateOverride, resetRegionFn, resetPage, resetAllFn, overrides, customPresets, applyPreset, savePresetFn, removePresetFn]);

  return (
    <LayoutEditorContext.Provider value={value}>
      {children}
    </LayoutEditorContext.Provider>
  );
}
