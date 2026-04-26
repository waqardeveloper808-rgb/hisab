"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { WorkspaceV2Sidebar } from "./WorkspaceV2Sidebar";
import { WorkspaceV2Topbar } from "./WorkspaceV2Topbar";
import { useIsMobile } from "@/lib/workspace-v2/use-media-query";

const COLLAPSED_KEY = "hisabix.wsv2.sidebar.collapsed";

const collapsedListeners = new Set<() => void>();

function subscribeCollapsed(callback: () => void) {
  collapsedListeners.add(callback);
  return () => collapsedListeners.delete(callback);
}

function getCollapsedSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function getCollapsedServerSnapshot(): boolean {
  return false;
}

function writeCollapsed(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COLLAPSED_KEY, value ? "true" : "false");
  } catch {
    /* ignore */
  }
  collapsedListeners.forEach((cb) => cb());
}

export function WorkspaceV2Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isMobile = useIsMobile();
  const persistedCollapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    writeCollapsed(!getCollapsedSnapshot());
  }, []);

  // Close drawer on route change without calling setState in an effect on
  // every render: derive a key that changes when the path changes and
  // trigger close exactly when the path differs from the last known.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    if (mobileOpen) setMobileOpen(false);
    setLastPath(pathname);
  }

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    if (mobileOpen && isMobile) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen, isMobile]);

  const effectiveCollapsed = isMobile ? false : persistedCollapsed;

  return (
    <div className="wsv2-shell" data-collapsed={effectiveCollapsed ? "true" : "false"}>
      <WorkspaceV2Sidebar
        collapsed={effectiveCollapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <WorkspaceV2Topbar onOpenMobileSidebar={() => setMobileOpen(true)} />
      <main className="wsv2-main">{children}</main>
      {mobileOpen ? (
        <button
          type="button"
          className="wsv2-mobile-overlay"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
    </div>
  );
}
