"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  SUGGESTION_DISMISSED_KEY,
  SUGGESTIONS_ENABLED_KEY,
  dismissSuggestion,
  readDismissed,
  readSuggestionsEnabled,
  writeSuggestionsEnabled,
} from "./suggestions";

type Subscriber = () => void;

const dismissedListeners = new Set<Subscriber>();
const enabledListeners = new Set<Subscriber>();

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === SUGGESTION_DISMISSED_KEY) dismissedListeners.forEach((cb) => cb());
    if (event.key === SUGGESTIONS_ENABLED_KEY) enabledListeners.forEach((cb) => cb());
  });
}

function notifyDismissed() {
  dismissedListeners.forEach((cb) => cb());
}

function notifyEnabled() {
  enabledListeners.forEach((cb) => cb());
}

function subscribeDismissed(callback: Subscriber): () => void {
  dismissedListeners.add(callback);
  return () => dismissedListeners.delete(callback);
}

function subscribeEnabled(callback: Subscriber): () => void {
  enabledListeners.add(callback);
  return () => enabledListeners.delete(callback);
}

function getDismissedSnapshot(id: string): boolean {
  return Boolean(readDismissed()[id]);
}

function getDismissedServerSnapshot(): boolean {
  return false;
}

function getEnabledSnapshot(): boolean {
  return readSuggestionsEnabled();
}

function getEnabledServerSnapshot(): boolean {
  return true;
}

export function useSuggestionDismissed(id: string): {
  dismissed: boolean;
  dismiss: () => void;
} {
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    () => getDismissedSnapshot(id),
    getDismissedServerSnapshot,
  );

  const dismiss = useCallback(() => {
    dismissSuggestion(id);
    notifyDismissed();
  }, [id]);

  return { dismissed, dismiss };
}

export function useSuggestionsEnabled(): {
  enabled: boolean;
  setEnabled: (next: boolean) => void;
} {
  const enabled = useSyncExternalStore(
    subscribeEnabled,
    getEnabledSnapshot,
    getEnabledServerSnapshot,
  );

  const setEnabled = useCallback((next: boolean) => {
    writeSuggestionsEnabled(next);
    notifyEnabled();
  }, []);

  return { enabled, setEnabled };
}
