export const SUGGESTION_DISMISSED_KEY = "hisabix.wsv2.dismissed";
export const SUGGESTIONS_ENABLED_KEY = "hisabix.wsv2.suggestions.enabled";

export type DismissalSet = Record<string, true>;

export function readDismissed(): DismissalSet {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SUGGESTION_DISMISSED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as DismissalSet;
    }
    return {};
  } catch {
    return {};
  }
}

export function writeDismissed(map: DismissalSet) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SUGGESTION_DISMISSED_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function dismissSuggestion(id: string) {
  const current = readDismissed();
  current[id] = true;
  writeDismissed(current);
}

export function isSuggestionDismissed(id: string): boolean {
  const current = readDismissed();
  return Boolean(current[id]);
}

export function readSuggestionsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(SUGGESTIONS_ENABLED_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

export function writeSuggestionsEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SUGGESTIONS_ENABLED_KEY, enabled ? "true" : "false");
  } catch {
    /* ignore */
  }
}

export function clearAllDismissed() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SUGGESTION_DISMISSED_KEY);
  } catch {
    /* ignore */
  }
}
