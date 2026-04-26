"use client";

import { useCallback, useSyncExternalStore } from "react";

export type WsV2Theme = "light" | "comfort" | "dark";

export const WSV2_THEME_KEY = "hisabix.wsv2.theme";
export const WSV2_THEMES: WsV2Theme[] = ["light", "comfort", "dark"];
export const WSV2_THEME_LABELS: Record<WsV2Theme, string> = {
  light: "Light",
  comfort: "Eye Comfort",
  dark: "Dark",
};

const themeListeners = new Set<() => void>();

// Cached snapshot — getSnapshot for useSyncExternalStore must return a stable
// value when nothing has changed. We initialise lazily on first read so SSR
// returns a deterministic "light" via the server snapshot.
let cachedTheme: WsV2Theme = "light";
let snapshotInitialized = false;

function isValidTheme(value: string | null): value is WsV2Theme {
  return value === "light" || value === "comfort" || value === "dark";
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== WSV2_THEME_KEY) return;
    cachedTheme = isValidTheme(event.newValue) ? event.newValue : "light";
    snapshotInitialized = true;
    themeListeners.forEach((cb) => cb());
  });
}

function subscribeTheme(callback: () => void): () => void {
  themeListeners.add(callback);
  return () => {
    themeListeners.delete(callback);
  };
}

function getThemeSnapshot(): WsV2Theme {
  if (typeof window === "undefined") return "light";
  if (!snapshotInitialized) {
    snapshotInitialized = true;
    try {
      const raw = window.localStorage.getItem(WSV2_THEME_KEY);
      cachedTheme = isValidTheme(raw) ? raw : "light";
    } catch {
      cachedTheme = "light";
    }
  }
  return cachedTheme;
}

function getThemeServerSnapshot(): WsV2Theme {
  return "light";
}

export function writeWsV2Theme(next: WsV2Theme): void {
  cachedTheme = next;
  snapshotInitialized = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(WSV2_THEME_KEY, next);
    } catch {
      /* ignore storage quota / disabled storage */
    }
  }
  themeListeners.forEach((cb) => cb());
}

export function useWsV2Theme(): {
  theme: WsV2Theme;
  setTheme: (next: WsV2Theme) => void;
} {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );
  const setTheme = useCallback((next: WsV2Theme) => {
    writeWsV2Theme(next);
  }, []);
  return { theme, setTheme };
}
