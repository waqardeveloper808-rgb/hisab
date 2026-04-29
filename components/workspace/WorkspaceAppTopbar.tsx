"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CircleHelp, Home, Menu, Plus, Search, ShieldCheck, UserRound } from "lucide-react";
import { USER_WORKSPACE_BASE, dashboardLink, navGroups } from "@/lib/workspace/navigation";
import { WorkspaceAppThemeSwitcher } from "./WorkspaceAppThemeSwitcher";

type Props = {
  onOpenMobileSidebar: () => void;
};

function resolveTitle(pathname: string): { label: string; sub: string } {
  const flat = pathname.replace(/\/$/, "");
  if (flat === USER_WORKSPACE_BASE || flat === dashboardLink.href.replace(/\/$/, "")) {
    return { label: "Workspace overview", sub: "Operational summary" };
  }
  for (const group of navGroups) {
    const match = group.links.find((link) => {
      const target = link.href.split("?")[0];
      return flat === target || flat.startsWith(`${target}/`);
    });
    if (match) {
      return { label: match.label, sub: group.label };
    }
  }
  if (flat.includes("/templates/studio")) {
    return { label: "Template studio", sub: "Templates" };
  }
  if (flat.includes("/settings/")) {
    return { label: "Settings", sub: "Workspace" };
  }
  if (flat.includes("/help")) {
    return { label: "Help center", sub: "Workspace" };
  }
  return { label: "Workspace", sub: "Hisabix" };
}

export function WorkspaceAppTopbar({ onOpenMobileSidebar }: Props) {
  const pathname = usePathname() ?? USER_WORKSPACE_BASE;
  const title = resolveTitle(pathname);

  return (
    <header className="wsv2-topbar" role="banner">
      <button
        type="button"
        className="wsv2-icon-btn wsv2-mobile-only"
        aria-label="Open menu"
        onClick={onOpenMobileSidebar}
      >
        <Menu size={16} />
      </button>

      <Link
        href="/"
        className="wsv2-icon-btn shrink-0"
        aria-label="Go to homepage"
        title="Home"
      >
        <Home size={16} strokeWidth={1.75} aria-hidden />
      </Link>

      <div className="wsv2-topbar-title">
        <span className="label">{title.sub}</span>
        <span className="value">{title.label}</span>
      </div>

      <label className="wsv2-topbar-search" aria-label="Search workspace">
        <Search size={14} color="var(--wsv2-ink-subtle)" />
        <input type="search" placeholder="Search invoices, customers, products" />
      </label>

      <div className="wsv2-topbar-actions">
        <span
          className="wsv2-pill"
          data-tone="warning"
          title="Demo data shown — no production writes"
          aria-label="Preview mode"
        >
          <ShieldCheck size={12} /> Preview mode
        </span>
        <Link
          href="/workspace/invoices/new?documentType=tax_invoice"
          className="wsv2-btn"
          aria-label="Create new tax invoice"
        >
          <Plus size={14} /> New invoice
        </Link>
        <WorkspaceAppThemeSwitcher />
        <button
          type="button"
          className="wsv2-icon-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={15} />
        </button>
        <Link
          href={`${USER_WORKSPACE_BASE}/help`}
          className="wsv2-icon-btn"
          aria-label="Help center"
          title="Help center"
        >
          <CircleHelp size={15} />
        </Link>
        <Link
          href={`${USER_WORKSPACE_BASE}/settings/profile`}
          className="wsv2-icon-btn"
          aria-label="User profile"
          title="User profile"
        >
          <UserRound size={15} />
        </Link>
      </div>
    </header>
  );
}
