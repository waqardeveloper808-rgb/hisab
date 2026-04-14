"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/Button";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { findActiveWorkspaceNavItem, getWorkspaceRoleFromPath, workspaceRoleOrder, workspaceRoles } from "@/data/role-workspace";
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
  initialGroupLabel,
  onNavigate,
}: {
  navGroups: WorkspaceShellProps extends never ? never : ReturnType<typeof getWorkspaceRoleFromPath> extends never ? never : Array<(typeof workspaceRoles)[keyof typeof workspaceRoles]["sidebarGroups"][number]>;
  pathname: string;
  basePath: string;
  initialGroupLabel: string;
  onNavigate: () => void;
}) {
  const [openGroupLabel, setOpenGroupLabel] = useState(initialGroupLabel);

  return navGroups.map((group) => {
    const isOpen = openGroupLabel === group.label;
    const groupHasActiveItem = group.items.some((item) => {
      const prefixes = [item.href, ...(item.matchPrefixes ?? [])].map((href) => mapWorkspaceHref(href, basePath));
      return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    });

    return (
      <section key={group.label} className="border-b border-line/70 pb-2 last:border-b-0 last:pb-0">
        <button
          type="button"
          onClick={() => setOpenGroupLabel((current) => current === group.label ? "" : group.label)}
          className={[
            "w-full rounded-md px-1 py-1 text-left text-[10px] font-semibold uppercase tracking-[0.16em]",
            groupHasActiveItem ? "text-primary" : "text-muted hover:text-ink",
          ].join(" ")}
        >
          {group.label}
        </button>
        {isOpen ? (
          <nav aria-label={group.label} className="mt-1 space-y-0.5">
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
                    "block rounded-md px-2 py-1.5 text-sm font-medium",
                    active ? "bg-primary-soft text-primary" : "text-ink hover:bg-surface-soft",
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
  const settingsTemplatesPath = mapWorkspaceHref("/workspace/settings/templates", basePath);
  const invoiceWorkflowRoute = pathname === invoiceRegisterPath || pathname.startsWith(`${invoiceRegisterPath}/`) || pathname.startsWith(`${invoiceDocumentPath}/`);
  const templateManagementRoute = pathname === templateRegisterPath || pathname.startsWith(`${templateRegisterPath}/`) || pathname === settingsTemplatesPath || pathname.startsWith(`${settingsTemplatesPath}/`);
  const compactOperationalRoute = invoiceWorkflowRoute || templateManagementRoute;
  const navGroups = roleDefinition.sidebarGroups;
  const activeGroupLabel = navGroups.find((group) => group.items.some((item) => {
    const prefixes = [item.href, ...(item.matchPrefixes ?? [])].map((href) => mapWorkspaceHref(href, basePath));
    return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }))?.label ?? navGroups[0]?.label ?? "";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const showRoleSwitcher = !compactOperationalRoute;
  const showHeaderAccountCard = !compactOperationalRoute;

  const headerLabel = compactOperationalRoute ? (activeItem?.label ?? (templateManagementRoute ? "Document Templates" : "Invoices")) : (activeItem?.label ?? roleDefinition.label);
  const compactStatus = isGuestPreview ? "Preview" : access?.membership?.role ?? session.platformRole ?? "Company";

  const sidebarNavigation = useMemo(() => (
    <SidebarNavigation
      key={pathname}
      navGroups={navGroups}
      pathname={pathname}
      basePath={basePath}
      initialGroupLabel={activeGroupLabel}
      onNavigate={() => setMobileSidebarOpen(false)}
    />
  ), [activeGroupLabel, basePath, navGroups, pathname]);

  return (
    <div className="min-h-screen bg-[#f7faf8] text-ink" data-inspector-shell="workspace" data-inspector-data-mode={isGuestPreview ? "preview" : "authenticated"}>
      <div className={[
        "relative mx-auto flex min-h-screen gap-2 px-0 lg:px-2",
        compactOperationalRoute ? "max-w-[1520px]" : "max-w-[1440px]",
      ].join(" ")}>
        {mobileSidebarOpen ? <button type="button" aria-label="Close workspace navigation" className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setMobileSidebarOpen(false)} /> : null}

        <aside className={[
          "z-40 shrink-0 border-r border-line bg-[#f4f8f6] lg:sticky lg:top-0 lg:h-screen lg:self-start",
          compactOperationalRoute ? "w-[11rem] xl:w-[11.5rem]" : "w-[11.5rem] xl:w-[12rem]",
          mobileSidebarOpen ? "fixed inset-y-0 left-0 block" : "hidden lg:block",
        ].join(" ")}>
          <div className="flex h-full flex-col px-2.5 py-2.5">
            <div className="flex h-9 items-center justify-between">
              <BrandMark compact />
              <button type="button" onClick={() => setMobileSidebarOpen(false)} className="text-xs font-semibold text-muted lg:hidden">Close</button>
            </div>
            <div className="mt-2 flex-1 overflow-y-auto pr-1">
              <div className="space-y-2">{sidebarNavigation}</div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className={[
            "sticky top-0 z-20 border-b border-line bg-[#f7faf8]/95 backdrop-blur",
            compactOperationalRoute ? "h-11 px-2.5 lg:px-3" : "min-h-11 px-2.5 py-1.5 lg:px-3",
          ].join(" ")}>
            <div className={[
              "flex h-full items-center justify-between gap-3",
            ].join(" ")}>
              <div className="flex min-w-0 items-center gap-2.5">
                <button type="button" onClick={() => setMobileSidebarOpen(true)} className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink lg:hidden">Menu</button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{headerLabel}</p>
                    {isGuestPreview ? <span className="rounded-full border border-primary/20 bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Preview</span> : null}
                    {compactOperationalRoute && !isGuestPreview ? <span className="hidden rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted sm:inline-flex">{compactStatus}</span> : null}
                  </div>
                  {!compactOperationalRoute ? <p className="truncate text-xs text-muted">{activeItem ? `${roleDefinition.label} / ${activeItem.label}` : roleDefinition.description}</p> : null}
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
                            ? "bg-primary text-white shadow-[0_16px_34px_-22px_rgba(31,122,83,0.45)]"
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
                {showHeaderAccountCard && !compactOperationalRoute ? <span className="hidden text-xs text-muted xl:inline">{session.name}</span> : null}
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
          <main className={compactOperationalRoute ? "flex-1 px-2.5 py-2 lg:px-3" : "flex-1 px-2.5 py-2.5 lg:px-3"} data-inspector-workspace-mode={isGuestPreview ? "preview" : "authenticated"}>{children}</main>
        </div>
      </div>
    </div>
  );
}