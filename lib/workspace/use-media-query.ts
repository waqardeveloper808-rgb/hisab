"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string) {
  return (callback: () => void) => {
    if (typeof window === "undefined") return () => undefined;
    const list = window.matchMedia(query);
    const handler = () => callback();
    list.addEventListener("change", handler);
    return () => list.removeEventListener("change", handler);
  };
}

function snapshot(query: string) {
  return () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  };
}

function serverSnapshot(): boolean {
  return false;
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(subscribe(query), snapshot(query), serverSnapshot);
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 1023px)");
}
