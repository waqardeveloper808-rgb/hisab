"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/Button";
import { CommandPalette } from "@/components/workspace/CommandPalette";
import { useLayoutEditorSafe } from "@/components/workspace/LayoutEditorProvider";
import { LayoutEditorPanel } from "@/components/workspace/LayoutEditorPanel";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { findActiveWorkspaceNavItem, getWorkspaceRoleFromPath, workspaceRoleOrder, workspaceRoles } from "@/data/role-workspace";
import { getAccountingAccessState, getInvoiceAccessState } from "@/lib/subscription-access";
import { mapWorkspaceHref } from "@/lib/workspace-path";
import type { WorkspaceAccessProfile } from "@/lib/workspace-api";

type WorkspaceShellProps = {
  session: {
    id: number;
    name: string;
    email: string;
    platformRole?: string;
  };
  access: WorkspaceAccessProfile | null;
  children: React.ReactNode;
  showLogout?: boolean;
};

function SidebarNavigation({
  navGroups,
  pathname,
  basePath,
  activeGroupLabel,
  onNavigate,
}: {
  navGroups: WorkspaceShellProps extends never ? never : ReturnType<typeof getWorkspaceRoleFromPath> extends never ? never : Array<(typeof workspaceRoles)[keyof typeof workspaceRoles]["sidebarGroups"][number]>;
  pathname: string;
  basePath: string;
  activeGroupLabel: string;
  onNavigate: () => void;
}) {
  const storageKey = useMemo(() => `gulf-hisab-sidebar:${basePath || "root"}`, [basePath]);
  const [openGroupLabel, setOpenGroupLabel] = useState<string>(() => {
    const fallback = activeGroupLabel || navGroups[0]?.label || "";

    if (typeof window === "undefined") {
      return fallback;
    }

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) {
        return fallback;
      }

      const parsed = JSON.parse(stored);
      if (typeof parsed === "string" && navGroups.some((group) => group.label === parsed)) {
        return parsed;
      }
    } catch {
      // Ignore malformed persisted sidebar state.
    }

    return fallback;
  });

  useEffect(() => {
    if (!activeGroupLabel) {
      return;
    }

    setOpenGroupLabel(activeGroupLabel);
  }, [activeGroupLabel, pathname]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(openGroupLabel));
    } catch {
      // Ignore storage failures in private browsing or blocked environments.
    }
  }, [openGroupLabel, storageKey]);

  return navGroups.map((group) => {
    const groupHasActiveItem = group.items.some((item) => {
      const prefixes = [item.href, ...(item.matchPrefixes ?? [])].map((href) => mapWorkspaceHref(href, basePath));
      return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    });
    const isOpen = openGroupLabel === group.label || groupHasActiveItem;

    return (
      <section key={group.label} className="border-b border-line/60 pb-0.5 last:border-b-0 last:pb-0">
        <button
          type="button"
          onClick={() => setOpenGroupLabel((current) => current === group.label ? "" : group.label)}
          className={[
            "flex w-full items-center justify-between rounded-sm border px-1.5 py-0.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] transition",
            groupHasActiveItem
              ? "border-primary/20 bg-primary-soft text-primary"
              : isOpen
                ? "border-line bg-white text-ink"
                : "border-transparent text-muted hover:border-line hover:bg-white hover:text-ink",
          ].join(" ")}
          aria-expanded={isOpen}
        >
          <span>{group.label}</span>
          <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-bold tracking-normal text-muted">{group.items.length}</span>
        </button>
        {isOpen ? (
          <nav aria-label={group.label} className="mt-0.5 space-y-px pl-0.5">
            {group.items.map((item) => {
              const href = mapWorkspaceHref(item.href, basePath);
              const prefixes = [item.href, ...(item.matchPrefixes ?? [])].map((value) => mapWorkspaceHref(value, basePath));
              const active = prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

              return (
                <Link
                  key={item.href}
                  href={href}
                  onClick={onNavigate}
                  className={[
                    "block rounded-sm border-l-2 px-1.5 py-0.5 text-[11px] font-medium leading-4 transition",
                    active
                      ? "border-primary bg-primary-soft/80 text-primary"
                      : "border-transparent text-ink hover:border-line hover:bg-surface-soft",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </section>
    );
  });
}

export function WorkspaceShell({ session, access, children, showLogout = true }: WorkspaceShellProps) {
  const pathname = usePathname();
  const { basePath } = useWorkspacePath();
  const isGuestPreview = session.id <= 0;
  const currentRole = getWorkspaceRoleFromPath(pathname);
  const roleDefinition = workspaceRoles[currentRole];
  const activeItem = findActiveWorkspaceNavItem(pathname, currentRole);
  const invoiceRegisterPath = mapWorkspaceHref("/workspace/user/invoices", basePath);
  const invoiceDocumentPath = mapWorkspaceHref("/workspace/invoices", basePath);
  const templateRegisterPath = mapWorkspaceHref("/workspace/user/document-templates", basePath);
  const invoiceTemplatePath = mapWorkspaceHref("/workspace/user/invoice-templates", basePath);
  const quotationTemplatePath = mapWorkspaceHref("/workspace/user/quotation-templates", basePath);
  const proformaTemplatePath = mapWorkspaceHref("/workspace/user/proforma-templates", basePath);
  const creditTemplatePath = mapWorkspaceHref("/workspace/user/credit-note-templates", basePath);
  const debitTemplatePath = mapWorkspaceHref("/workspace/user/debit-note-templates", basePath);
  const purchaseTemplatePath = mapWorkspaceHref("/workspace/user/purchase-templates", basePath);
  const settingsTemplatesPath = mapWorkspaceHref("/workspace/settings/templates", basePath);
  const invoiceWorkflowRoute = pathname === invoiceRegisterPath || pathname.startsWith(`${invoiceRegisterPath}/`) || pathname.startsWith(`${invoiceDocumentPath}/`);
  const templateManagementRoute = [templateRegisterPath, invoiceTemplatePath, quotationTemplatePath, proformaTemplatePath, creditTemplatePath, debitTemplatePath, purchaseTemplatePath, settingsTemplatesPath]
    .some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const compactOperationalRoute = invoiceWorkflowRoute || templateManagementRoute;
  const navGroups = roleDefinition.sidebarGroups;
  const activeGroupLabel = navGroups.find((group) => group.items.some((item) => {
    const prefixes = [item.href, ...(item.matchPrefixes ?? [])].map((href) => mapWorkspaceHref(href, basePath));
    return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }))?.label ?? navGroups[0]?.label ?? "";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const showRoleSwitcher = !compactOperationalRoute;
  const showHeaderAccountCard = !compactOperationalRoute;
  const invoiceAccessState = getInvoiceAccessState(access);
  const accountingAccessState = getAccountingAccessState(access);
  const shellNotice = invoiceWorkflowRoute ? invoiceAccessState : accountingAccessState;

  const headerLabel = compactOperationalRoute
      ? (activeItem?.label ?? (templateManagementRoute ? "Document Templates" : "Invoices"))
      : (activeItem?.label ?? roleDefinition.label);
  const compactStatus = isGuestPreview ? "Preview" : access?.membership?.role ?? session.platformRole ?? "Company";

  const sidebarNavigation = useMemo(() => (
    <SidebarNavigation
      navGroups={navGroups}
      pathname={pathname}
      basePath={basePath}
      activeGroupLabel={activeGroupLabel}
      onNavigate={() => setMobileSidebarOpen(false)}
    />
  ), [activeGroupLabel, basePath, navGroups, pathname]);

  return (
    <div className="min-h-screen bg-canvas text-ink" data-inspector-shell="workspace" data-inspector-data-mode={isGuestPreview ? "preview" : "authenticated"}>
      <div className={[
        "relative mx-auto flex min-h-screen gap-0.5 px-0 lg:px-0.5",
        compactOperationalRoute ? "max-w-[1760px]" : "max-w-[1640px]",
      ].join(" ")}>
        {mobileSidebarOpen ? <button type="button" aria-label="Close workspace navigation" className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setMobileSidebarOpen(false)} /> : null}

        <aside className={[
          "z-40 shrink-0 border-r border-line bg-surface-soft lg:sticky lg:top-0 lg:h-screen lg:self-start",
          compactOperationalRoute ? "w-[8.6rem] xl:w-[9rem]" : "w-[9rem] xl:w-[9.5rem]",
          mobileSidebarOpen ? "fixed inset-y-0 left-0 block" : "hidden lg:block",
        ].join(" ")}>
          <div className="flex h-full flex-col px-1 py-0.5">
            <div className="flex min-h-10 items-start justify-between">
              <BrandMark variant="compact" className="justify-center" />
              <button type="button" onClick={() => setMobileSidebarOpen(false)} className="text-xs font-semibold text-muted lg:hidden">Close</button>
            </div>
            <div className="mb-0.5 mt-0.5 border-b border-line/50" />
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="space-y-1">
                {sidebarNavigation}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className={[
            "sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur",
              compactOperationalRoute ? "h-8 px-1.5 lg:px-2" : "min-h-8 px-2 py-0.5 lg:px-2",
          ].join(" ")}>
            <div className={[
              "flex h-full items-center justify-between gap-3",
            ].join(" ")}>
              <div className="flex min-w-0 items-center gap-2.5">
                <button type="button" onClick={() => setMobileSidebarOpen(true)} className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink lg:hidden">Menu</button>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-ink sm:text-sm">{headerLabel}</p>
                    {isGuestPreview ? <span className="rounded-full border border-primary/20 bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Preview</span> : null}
                    {compactOperationalRoute && !isGuestPreview ? <span className="hidden rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted sm:inline-flex">{compactStatus}</span> : null}
                  </div>
                  {!compactOperationalRoute ? <p className="truncate text-[10px] text-muted">{activeItem ? `${roleDefinition.label} / ${activeItem.label}` : roleDefinition.description}</p> : null}
                </div>
              </div>
              {!compactOperationalRoute && showRoleSwitcher ? (
                <div className="hidden flex-wrap gap-2 xl:flex">
                  {workspaceRoleOrder.map((roleKey) => {
                    const role = workspaceRoles[roleKey];
                    const active = currentRole === roleKey;

                    return (
                      <Link
                        key={roleKey}
                        href={mapWorkspaceHref(role.homeHref, basePath)}
                        className={[
                          "rounded-full px-4 py-2 text-sm font-semibold transition",
                          active
                            ? "bg-primary text-white shadow-elevated"
                            : "border border-line bg-surface-soft text-ink hover:border-primary/30 hover:bg-white hover:text-primary",
                        ].join(" ")}
                      >
                        {role.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
              <div className={[
                "flex items-center justify-end",
                compactOperationalRoute ? "gap-1.5" : "gap-2",
              ].join(" ")}>
                <Button size="xs" href={mapWorkspaceHref("/workspace/accounting", basePath)} variant={pathname.startsWith(mapWorkspaceHref("/workspace/accounting", basePath)) ? "primary" : "secondary"}>
                  Accounting
                </Button>
                {showHeaderAccountCard && !compactOperationalRoute ? <span className="hidden text-xs text-muted xl:inline">{session.name}</span> : null}
                <LayoutEditorToggle />
                <Button size="xs" href={mapWorkspaceHref("/workspace/help", basePath)} variant={pathname.startsWith(mapWorkspaceHref("/workspace/help", basePath)) ? "primary" : "secondary"}>
                  Help
                </Button>
                {isGuestPreview ? (
                  <Button size="xs" href="/login" variant="secondary">
                    Log in
                  </Button>
                ) : showLogout ? <LogoutButton /> : null}
              </div>
            </div>
          </header>
          {shellNotice ? (
            <div className={[
              "border-b px-2 py-1.5 text-[11px]",
              shellNotice.tone === "critical"
                ? "border-red-200 bg-red-50 text-red-800"
                : shellNotice.tone === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-sky-200 bg-sky-50 text-sky-800",
            ].join(" ")}>
              <span className="font-semibold">{shellNotice.title}:</span> {shellNotice.detail}
            </div>
          ) : null}
          <main className={compactOperationalRoute ? "flex-1 px-1.5 py-1.5 lg:px-2" : "flex-1 px-1.5 py-1.5 lg:px-2"} data-inspector-workspace-mode={isGuestPreview ? "preview" : "authenticated"}>{children}</main>
        </div>
      </div>
      <LayoutEditorPanel />
      <CommandPalette />
    </div>
  );
}

function LayoutEditorToggle() {
  const editor = useLayoutEditorSafe();
  if (!editor) return null;
  return (
    <button
      type="button"
      onClick={() => editor.setActive(!editor.active)}
      className={[
        "rounded border px-2 py-0.5 text-[10px] font-semibold transition",
        editor.active
          ? "border-primary bg-primary text-white"
          : "border-line bg-white text-muted hover:border-primary/30 hover:text-primary",
      ].join(" ")}
      title="Toggle Layout Editor"
    >
      Layout
    </button>
  );
}