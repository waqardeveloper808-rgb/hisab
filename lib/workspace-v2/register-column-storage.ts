const PREFIX = "hisabix.wsv2.regcols.";

export function loadColumnVisibility(registerId: string, defaultVisible: string[]): string[] {
  if (typeof window === "undefined") return defaultVisible;
  try {
    const raw = window.localStorage.getItem(PREFIX + registerId);
    if (!raw) return defaultVisible;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultVisible;
    const set = new Set(defaultVisible);
    const next = parsed.filter((id): id is string => typeof id === "string" && set.has(id));
    return next.length > 0 ? next : defaultVisible;
  } catch {
    return defaultVisible;
  }
}

export function saveColumnVisibility(registerId: string, visibleIds: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + registerId, JSON.stringify(visibleIds));
  } catch {
    /* quota */
  }
}
