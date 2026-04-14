"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const showRoleSwitcher = !compactOperationalRoute;
  const showHeaderAccountCard = !compactOperationalRoute;
  const headerEyebrow = invoiceWorkflowRoute ? "Sales" : templateManagementRoute ? "Settings" : "Workspace";
  const headerTitle = invoiceWorkflowRoute ? (activeItem?.label ?? "Invoices") : templateManagementRoute ? "Document Templates" : roleDefinition.label;
  const headerDescription = invoiceWorkflowRoute
    ? (pathname.startsWith(`${invoiceDocumentPath}/`) ? "Invoice record" : "Invoice register")
    : templateManagementRoute
      ? "Template management"
    : activeItem ? `${activeItem.label} is active inside the ${roleDefinition.label.toLowerCase()}.` : roleDefinition.description;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5faf6_0%,#eef5f0_45%,#f9fbf9_100%)] text-ink">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(31,122,83,0.14),_transparent_62%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1580px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden w-80 shrink-0 xl:block">
          <div className="sticky top-4 overflow-hidden rounded-[2rem] border border-white/70 bg-white/84 p-5 shadow-[0_28px_50px_-34px_rgba(17,32,24,0.22)] backdrop-blur-xl">
            <BrandMark compact />

            {!compactOperationalRoute ? (
              <div className="mt-5 rounded-[1.5rem] border border-line bg-surface-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Role workspace</p>
                <h2 className="mt-2 text-lg font-semibold text-ink">{roleDefinition.label}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{roleDefinition.description}</p>
              </div>
            ) : null}

            {!templateManagementRoute ? (
              <div className="mt-5 grid gap-2">
                {roleDefinition.quickActions.slice(0, 3).map((action) => (
                  <Button
                    key={action.href}
                    href={mapWorkspaceHref(action.href, basePath)}
                    variant={action.variant ?? "secondary"}
                    fullWidth
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            ) : null}

            <div className="mt-6 space-y-5">
              {roleDefinition.sidebarGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{group.label}</p>
                  <nav aria-label={group.label} className="mt-2 space-y-2">
                    {group.items.map((item) => {
                      const prefixes = [item.href, ...(item.matchPrefixes ?? [])].map((href) => mapWorkspaceHref(href, basePath));
                      const active = prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

                      return (
                        <Link
                          key={item.href}
                          href={mapWorkspaceHref(item.href, basePath)}
                          className={[
                            "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold",
                            active
                              ? "bg-primary text-white shadow-[0_18px_40px_-24px_rgba(31,122,83,0.56)]"
                              : "bg-surface-soft text-ink hover:bg-primary-soft hover:text-primary",
                          ].join(" ")}
                        >
                          <span>{item.label}</span>
                          <span className={active ? "text-white/70" : "text-muted"}>→</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>

            {!compactOperationalRoute ? (
              <div className="mt-8 rounded-[1.5rem] border border-line bg-surface-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Current priorities</p>
                <div className="mt-3 space-y-3 text-sm leading-6 text-muted">
                  {roleDefinition.priorities.map((priority) => (
                    <p key={priority} className="rounded-[1.1rem] border border-line bg-white px-3 py-2.5">
                      {priority}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-4 z-20 rounded-[2rem] border border-white/70 bg-white/88 px-4 py-4 shadow-[0_24px_46px_-34px_rgba(17,32,24,0.18)] backdrop-blur-xl sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary">{headerEyebrow}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{headerTitle}</h1>
                <p className="mt-1 text-sm text-muted">{headerDescription}</p>
                {showRoleSwitcher ? (
                  <div className="mt-4 flex flex-wrap gap-2">
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
                {isGuestPreview ? (
                  <div className="mt-3 inline-flex rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Preview mode
                  </div>
                ) : null}
                {access?.subscription ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                    <span className="rounded-full bg-surface-soft px-3 py-1.5 font-semibold text-ink">{access.subscription.planName}</span>
                    <span className="rounded-full bg-surface-soft px-3 py-1.5">Invoice limit: {access.subscription.limits.invoiceLimit ?? "Unlimited"}</span>
                    <span className="rounded-full bg-surface-soft px-3 py-1.5">Customers: {access.subscription.limits.customerLimit ?? "Unlimited"}</span>
                    <span className="rounded-full bg-surface-soft px-3 py-1.5">Seats: {access.subscription.limits.accountantSeatLimit ?? "Unlimited"}</span>
                    {access.subscription.featureFlags.custom_fields_limit ? <span className="rounded-full bg-surface-soft px-3 py-1.5">Custom fields: {String(access.subscription.featureFlags.custom_fields_limit)}</span> : null}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3 xl:justify-end">
                {showHeaderAccountCard ? (
                  <div className="rounded-[1.2rem] border border-line bg-surface-soft px-4 py-2 text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Signed in</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{session.name}</p>
                    <p className="text-xs text-muted">{session.email}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-primary">
                      {isGuestPreview ? "guest" : access?.membership?.role ?? session.platformRole ?? "customer"}
                    </p>
                  </div>
                ) : null}
                <Button href={mapWorkspaceHref(roleDefinition.homeHref, basePath)} variant="secondary">
                  Role home
                </Button>
                <Button href={mapWorkspaceHref("/workspace/help", basePath)} variant={pathname.startsWith(mapWorkspaceHref("/workspace/help", basePath)) ? "primary" : "secondary"}>
                  Help
                </Button>
                {isGuestPreview ? (
                  <Button href="/login" variant="secondary">
                    Log in
                  </Button>
                ) : showLogout ? <LogoutButton /> : null}
              </div>
            </div>
          </header>
          <main className="flex-1 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}