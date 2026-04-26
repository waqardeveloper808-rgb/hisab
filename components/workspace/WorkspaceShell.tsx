"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  BadgeHelp,
  BookOpenText,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Calculator,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileCog,
  FileSpreadsheet,
  Files,
  Gauge,
  HandCoins,
  Package,
  Receipt,
  Settings2,
  ShoppingCart,
  SquareChartGantt,
  Users,
  Wallet,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/Button";
import { CommandPalette } from "@/components/workspace/CommandPalette";
import { useLayoutEditorSafe } from "@/components/workspace/LayoutEditorProvider";
import { LayoutEditorPanel } from "@/components/workspace/LayoutEditorPanel";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { WorkspaceRecoveryState } from "@/components/workspace/WorkspaceRecoveryState";
import { findActiveWorkspaceNavItem, getWorkspaceRoleFromPath, workspaceRoleOrder, workspaceRoles } from "@/data/role-workspace";
import { getAccountingAccessState, getInvoiceAccessState } from "@/lib/subscription-access";
import { mapWorkspaceHref } from "@/lib/workspace-path";
import type { WorkspaceAccessProfile } from "@/lib/workspace-api";
import type { WorkspaceAccessStatus } from "@/lib/workspace-session";

type WorkspaceShellProps = {
  session: {
    id: number;
    name: string;
    email: string;
    platformRole?: string;
    activeCompanyId?: number | null;
    activeCompanyLegalName?: string | null;
    accessStatus?: WorkspaceAccessStatus;
  };
  access: WorkspaceAccessProfile | null;
  children: React.ReactNode;
  showLogout?: boolean;
};

const onboardingWarningStorageKey = "hisabix:onboarding-warning";

const groupIconMap = {
  Dashboard: Gauge,
  Sales: Receipt,
  Purchases: ShoppingCart,
  Inventory: Package,
  Accounting: Calculator,
  Banking: Wallet,
  "VAT / Compliance": ClipboardList,
  Reports: FileSpreadsheet,
  Templates: FileCog,
  Settings: Settings2,
  "Platform Control": Building2,
  "Commercial Operations": BriefcaseBusiness,
  "Access / Governance": Users,
  "AI Review": SquareChartGantt,
  "Support Queue": BadgeHelp,
  "Customer Success": HandCoins,
  "Knowledge / Escalations": BookOpenText,
  Pipeline: BriefcaseBusiness,
  Outreach: Files,
} satisfies Record<string, ComponentType<{ className?: string }>>;

const itemIconRules: Array<{ test: RegExp; icon: ComponentType<{ className?: string }> }> = [
  { test: /invoice|quotation|proforma|credit|debit|bill/i, icon: Receipt },
  { test: /customer|vendor|user|agent|account/i, icon: Users },
  { test: /product|stock|material|inventory|item/i, icon: Package },
  { test: /report|trial|profit|balance|aging|vat|ledger|journal/i, icon: FileSpreadsheet },
  { test: /template/i, icon: FileCog },
  { test: /setting|company|access/i, icon: Settings2 },
  { test: /bank|payment|reconciliation/i, icon: Wallet },
  { test: /dashboard|overview|health|review/i, icon: Gauge },
  { test: /support|help|faq|assist/i, icon: BadgeHelp },
];

function resolveGroupIcon(label: string) {
  if (Object.prototype.hasOwnProperty.call(groupIconMap, label)) {
    return groupIconMap[label as keyof typeof groupIconMap];
  }
  return Boxes;
}

function resolveItemIcon(label: string, href: string) {
  const source = `${label} ${href}`;
  return itemIconRules.find((entry) => entry.test.test(source))?.icon ?? Files;
}

function SidebarNavigation({
  navGroups,
  pathname,
  basePath,
  onNavigate,
}: {
  navGroups: WorkspaceShellProps extends never ? never : ReturnType<typeof getWorkspaceRoleFromPath> extends never ? never : Array<(typeof workspaceRoles)[keyof typeof workspaceRoles]["sidebarGroups"][number]>;
  pathname: string;
  basePath: string;
  onNavigate: () => void;
}) {
  const storageKey = useMemo(() => `gulf-hisab-sidebar:${basePath || "root"}`, [basePath]);
  const [openGroupLabels, setOpenGroupLabels] = useState<string[]>(() => {
    const fallback = navGroups.length ? [navGroups[0].label] : [];

    if (typeof window === "undefined") {
      return fallback;
    }

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) {
        return fallback;
      }

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((entry): entry is string => typeof entry === "string" && navGroups.some((group) => group.label === entry));
        return valid.length ? valid : fallback;
      }
    } catch {
      // Ignore malformed persisted sidebar state.
    }

    return fallback;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(openGroupLabels));
    } catch {
      // Ignore storage failures in private browsing or blocked environments.
    }
  }, [openGroupLabels, storageKey]);

  function toggleGroup(label: string) {
    setOpenGroupLabels((current) => current.includes(label) ? current.filter((entry) => entry !== label) : [...current, label]);
  }

  return navGroups.map((group) => {
    const GroupIcon = resolveGroupIcon(group.label);
    const groupHasActiveItem = group.items.some((item) => {
      const prefixes = [item.href, ...(item.matchPrefixes ?? [])].map((href) => mapWorkspaceHref(href, basePath));
      return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    });
    const isOpen = openGroupLabels.includes(group.label);

    return (
      <section key={group.label} className="rounded-xl border border-line/70 bg-white/80 p-1">
        <button
          type="button"
          onClick={() => toggleGroup(group.label)}
          className={[
            "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[11px] font-semibold transition",
            groupHasActiveItem
              ? "bg-primary-soft text-primary"
              : "text-ink hover:bg-surface-soft",
          ].join(" ")}
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2">
            <GroupIcon className="h-4 w-4" />
            <span>{group.label}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-muted">{group.items.length}</span>
            {isOpen ? <ChevronDown className="h-4 w-4 text-muted" /> : <ChevronRight className="h-4 w-4 text-muted" />}
          </span>
        </button>
        {isOpen ? (
          <nav aria-label={group.label} className="mt-1 space-y-1">
            {group.items.map((item) => {
              const ItemIcon = resolveItemIcon(item.label, item.href);
              const href = mapWorkspaceHref(item.href, basePath);
              const prefixes = [item.href, ...(item.matchPrefixes ?? [])].map((value) => mapWorkspaceHref(value, basePath));
              const active = prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

              return (
                <Link
                  key={item.href}
                  href={href}
                  onClick={onNavigate}
                  className={[
                    "flex items-center gap-2 rounded-lg border px-2 py-2 text-[12px] font-medium leading-4 transition",
                    active
                      ? "border-primary/25 bg-primary-soft text-primary"
                      : "border-transparent text-ink hover:border-line hover:bg-surface-soft",
                  ].join(" ")}
                >
                  <ItemIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
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
  const searchParams = useSearchParams();
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [persistedOnboardingWarning, setPersistedOnboardingWarning] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(onboardingWarningStorageKey) === "skipped";
  });
  const [dismissedOnboardingWarning, setDismissedOnboardingWarning] = useState(false);
  const showRoleSwitcher = !compactOperationalRoute;
  const showHeaderAccountCard = !compactOperationalRoute;
  const invoiceAccessState = getInvoiceAccessState(access);
  const accountingAccessState = getAccountingAccessState(access);
  const shellNotice = invoiceWorkflowRoute ? invoiceAccessState : accountingAccessState;
  const recoveryMode = session.accessStatus === "company_context_missing"
    || session.accessStatus === "backend_unconfigured"
    || session.accessStatus === "backend_unavailable";

  const headerLabel = compactOperationalRoute
      ? (activeItem?.label ?? (templateManagementRoute ? "Document Templates" : "Invoices"))
      : (activeItem?.label ?? roleDefinition.label);
  const compactStatus = isGuestPreview ? "Preview" : access?.membership?.role ?? session.platformRole ?? "Company";
  const showOnboardingWarning = !dismissedOnboardingWarning && (persistedOnboardingWarning || searchParams.get("onboarding") === "skipped");

  const sidebarNavigation = useMemo(() => (
    <SidebarNavigation
      navGroups={navGroups}
      pathname={pathname}
      basePath={basePath}
      onNavigate={() => setMobileSidebarOpen(false)}
    />
  ), [basePath, navGroups, pathname]);

  return (
    <div className="min-h-screen bg-canvas text-ink" data-inspector-shell="workspace" data-inspector-data-mode={isGuestPreview ? "preview" : "authenticated"}>
      <div className={[
        "relative mx-auto flex min-h-screen gap-2 px-0 lg:px-2",
        compactOperationalRoute ? "max-w-[1760px]" : "max-w-[1640px]",
      ].join(" ")}>
        {mobileSidebarOpen ? <button type="button" aria-label="Close workspace navigation" className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setMobileSidebarOpen(false)} /> : null}

        <aside className={[
          "z-40 shrink-0 border-r border-line bg-surface-soft/80 lg:sticky lg:top-0 lg:h-screen lg:self-start",
          compactOperationalRoute ? "w-[16rem] xl:w-[16.5rem]" : "w-[16.25rem] xl:w-[16.75rem]",
          mobileSidebarOpen ? "fixed inset-y-0 left-0 block" : "hidden lg:block",
        ].join(" ")}>
          <div className="flex h-full flex-col px-2 py-2">
            <div className="flex min-h-14 items-center justify-between gap-2">
              <BrandMark variant="compact" className="justify-center" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{roleDefinition.eyebrow}</p>
                <p className="truncate text-sm font-semibold text-ink">{session.activeCompanyLegalName ?? roleDefinition.label}</p>
              </div>
              <button type="button" onClick={() => setMobileSidebarOpen(false)} className="text-xs font-semibold text-muted lg:hidden">Close</button>
            </div>
            <div className="mb-2 mt-2 border-b border-line/50" />
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="space-y-2">
                {sidebarNavigation}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className={[
            "sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur",
              compactOperationalRoute ? "h-12 px-3 lg:px-4" : "min-h-12 px-3 py-2 lg:px-4",
          ].join(" ")}>
            <div className={[
              "flex h-full items-center justify-between gap-3",
            ].join(" ")}>
              <div className="flex min-w-0 items-center gap-2.5">
                <button type="button" onClick={() => setMobileSidebarOpen(true)} className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink lg:hidden">Menu</button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-semibold text-ink">{headerLabel}</p>
                    {isGuestPreview ? <span className="rounded-full border border-primary/20 bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Preview</span> : null}
                    {compactOperationalRoute && !isGuestPreview ? <span className="hidden rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted sm:inline-flex">{compactStatus}</span> : null}
                  </div>
                  {!compactOperationalRoute ? <p className="truncate text-[11px] text-muted">{activeItem ? `${roleDefinition.label} / ${activeItem.label}` : roleDefinition.description}</p> : null}
                </div>
              </div>
              {!compactOperationalRoute && showRoleSwitcher ? (
                <div className="hidden flex-wrap gap-2 lg:flex">
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
                            : "border border-line bg-white text-ink hover:border-primary/30 hover:bg-primary-soft hover:text-primary",
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
                {process.env.NODE_ENV !== "production" ? <LayoutEditorToggle /> : null}
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
          {showOnboardingWarning ? (
            <div className="border-b border-primary/15 bg-primary-soft/50 px-3 py-2 text-[12px] text-ink">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span><span className="font-semibold text-primary">Company setup pending:</span> complete your company profile to prepare invoice defaults, tax details, and brand assets.</span>
                <div className="flex flex-wrap gap-2">
                  <Button size="xs" href={mapWorkspaceHref("/workspace/settings/company", basePath)} variant="secondary">Open company settings</Button>
                  <Button size="xs" href="/onboarding/company" variant="secondary">Resume setup</Button>
                  <button
                    type="button"
                    onClick={() => {
                      setDismissedOnboardingWarning(true);
                      setPersistedOnboardingWarning(false);
                    }}
                    className="rounded-md border border-line bg-white px-2 py-1 text-[11px] font-semibold text-ink"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ) : null}
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
          {isGuestPreview ? (
            <div className="border-b border-primary/15 bg-primary-soft/70 px-3 py-2 text-[12px] text-primary">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span><span className="font-semibold">Preview mode:</span> the full workspace is running on controlled demo data, and destructive actions require sign-in.</span>
                <Button size="xs" href={`/login?next=${encodeURIComponent(pathname || "/workspace/user")}`} variant="secondary">
                  Sign in to save changes
                </Button>
              </div>
            </div>
          ) : null}
          <main className={compactOperationalRoute ? "flex-1 px-1.5 py-1.5 lg:px-2" : "flex-1 px-1.5 py-1.5 lg:px-2"} data-inspector-workspace-mode={isGuestPreview ? "preview" : "authenticated"}>
            {recoveryMode ? (
              <WorkspaceRecoveryState accessStatus={session.accessStatus} session={session} />
            ) : children}
          </main>
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