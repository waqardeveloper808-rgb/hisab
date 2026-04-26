"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import { ChevronRight, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import {
  USER_WORKSPACE_BASE,
  dashboardLink,
  navGroups,
  type NavGroup,
} from "@/lib/workspace/navigation";
import { iconLogoPath, mainLogoPath, appName } from "@/lib/brand";

const STORAGE_KEY = "hisabix.wsv2.sidebar.openGroups";

// Stable empty snapshot used on the server and as the initial client snapshot
// before localStorage has been read. Returning the SAME reference across calls
// is required by React's useSyncExternalStore — otherwise getSnapshot keeps
// producing a new object on every render and triggers the
// "result of getSnapshot should be cached to avoid an infinite loop" warning.
const EMPTY_OPEN_MAP: Record<string, boolean> = Object.freeze({}) as Record<string, boolean>;

const groupListeners = new Set<() => void>();
let cachedOpenMap: Record<string, boolean> = EMPTY_OPEN_MAP;
let snapshotInitialized = false;

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      cachedOpenMap = parseStoredOpenMap(event.newValue);
      snapshotInitialized = true;
      groupListeners.forEach((cb) => cb());
    }
  });
}

function parseStoredOpenMap(raw: string | null): Record<string, boolean> {
  if (!raw) return EMPTY_OPEN_MAP;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, boolean>;
    }
  } catch {
    /* ignore parse errors and fall through to empty */
  }
  return EMPTY_OPEN_MAP;
}

function subscribeGroups(callback: () => void) {
  groupListeners.add(callback);
  return () => {
    groupListeners.delete(callback);
  };
}

function getOpenMapSnapshot(): Record<string, boolean> {
  if (typeof window === "undefined") return EMPTY_OPEN_MAP;
  if (!snapshotInitialized) {
    snapshotInitialized = true;
    try {
      cachedOpenMap = parseStoredOpenMap(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      cachedOpenMap = EMPTY_OPEN_MAP;
    }
  }
  return cachedOpenMap;
}

function getServerOpenMap(): Record<string, boolean> {
  return EMPTY_OPEN_MAP;
}

function writeOpenMap(next: Record<string, boolean>) {
  cachedOpenMap = next;
  snapshotInitialized = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / disabled storage */
    }
  }
  groupListeners.forEach((cb) => cb());
}

type Props = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function WorkspaceAppSidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: Props) {
  const pathname = usePathname() ?? "";
  const persistedOpenMap = useSyncExternalStore(
    subscribeGroups,
    getOpenMapSnapshot,
    getServerOpenMap,
  );

  const isLinkActive = useCallback(
    (href: string) => {
      const path = href.split("?")[0];
      if (path === USER_WORKSPACE_BASE) {
        return pathname === USER_WORKSPACE_BASE || pathname === `${USER_WORKSPACE_BASE}/dashboard`;
      }
      return pathname === path || pathname.startsWith(`${path}/`);
    },
    [pathname],
  );

  const isDashboardActive =
    pathname === USER_WORKSPACE_BASE || pathname === `${USER_WORKSPACE_BASE}/dashboard`;

  const resolveOpen = (group: NavGroup): boolean => {
    if (Object.prototype.hasOwnProperty.call(persistedOpenMap, group.id)) {
      return Boolean(persistedOpenMap[group.id]);
    }
    if (group.links.some((link) => isLinkActive(link.href))) return true;
    return group.id === "sales";
  };

  const toggleGroup = (id: string) => {
    const current = getOpenMapSnapshot();
    const computed = resolveOpenForId(id, current, isLinkActive);
    writeOpenMap({ ...current, [id]: !computed });
  };

  return (
    <aside className="wsv2-sidebar" data-open={mobileOpen ? "true" : "false"}>
      <div className="wsv2-sidebar-brand">
        {collapsed ? (
          <Image src={iconLogoPath} alt={`${appName} icon`} width={32} height={32} />
        ) : (
          <Image
            src={mainLogoPath}
            alt={appName}
            width={132}
            height={32}
            className="wsv2-sidebar-brand-text"
            style={{ height: 28, width: "auto" }}
          />
        )}
        <button
          type="button"
          className="wsv2-collapse-btn wsv2-mobile-only"
          aria-label="Close menu"
          onClick={onCloseMobile}
        >
          <X size={14} />
        </button>
      </div>

      <nav className="wsv2-sidebar-scroll" aria-label="Workspace navigation">
        <Link
          href={dashboardLink.href}
          className="wsv2-nav-flat"
          data-active={isDashboardActive ? "true" : "false"}
          onClick={onCloseMobile}
        >
          <dashboardLink.icon size={16} />
          <span className="wsv2-nav-label">{dashboardLink.label}</span>
        </Link>

        {navGroups.map((group) => {
          const open = resolveOpen(group);
          const containsActive = group.links.some((link) => isLinkActive(link.href));
          return (
            <div key={group.id} className="wsv2-nav-section">
              <button
                type="button"
                className="wsv2-nav-group-btn"
                data-open={open ? "true" : "false"}
                onClick={() => toggleGroup(group.id)}
                aria-expanded={open}
              >
                <group.icon size={15} />
                <span className="wsv2-nav-label">{group.label}</span>
                {containsActive && !open ? (
                  <span
                    aria-hidden="true"
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: "var(--wsv2-primary)",
                      marginLeft: "auto",
                      marginRight: 4,
                    }}
                  />
                ) : null}
                <ChevronRight className="wsv2-chevron" />
              </button>
              {open && !collapsed ? (
                <div className="wsv2-nav-children">
                  {group.links.map((link) => {
                    const active = isLinkActive(link.href);
                    return (
                      <Link
                        key={link.id}
                        href={link.href}
                        className="wsv2-nav-link"
                        data-active={active ? "true" : "false"}
                        onClick={onCloseMobile}
                      >
                        <link.icon />
                        <span className="wsv2-nav-label">{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="wsv2-sidebar-footer">
        <span className="wsv2-nav-label">Workspace preview</span>
        <button
          type="button"
          className="wsv2-collapse-btn"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapsed}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>
    </aside>
  );
}

function resolveOpenForId(
  id: string,
  map: Record<string, boolean>,
  isActive: (href: string) => boolean,
): boolean {
  if (Object.prototype.hasOwnProperty.call(map, id)) return Boolean(map[id]);
  const group = navGroups.find((g) => g.id === id);
  if (!group) return false;
  if (group.links.some((link) => isActive(link.href))) return true;
  return group.id === "sales";
}
