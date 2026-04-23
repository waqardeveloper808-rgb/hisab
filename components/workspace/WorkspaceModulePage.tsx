import Link from "next/link";
import { Button } from "@/components/Button";
import type { WorkspaceModulePageDefinition } from "@/data/role-workspace";
import { workspaceRoles } from "@/data/role-workspace";

export function WorkspaceModulePage({ page }: { page: WorkspaceModulePageDefinition }) {
  const role = workspaceRoles[page.role];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{role.label}</p>
          <h1 className="text-xl font-semibold text-ink">{page.title}</h1>
          <p className="text-sm text-muted">{page.description}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {page.quickActions.map((action) => (
            <Button key={action.href} href={action.href} size="xs" variant={action.variant ?? "secondary"}>
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {page.metrics.length ? (
        <div className="grid gap-3 md:grid-cols-3">
          {page.metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-line bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{metric.label}</p>
              <p className="mt-2 text-lg font-semibold text-ink">{metric.value}</p>
              <p className="mt-1 text-sm text-muted">{metric.detail}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted mb-1.5">Status</p>
          <div className="space-y-1">
            {page.alerts.map((alert) => (
              <div key={alert.title} className="rounded-lg border border-line bg-surface-soft/50 px-3 py-2">
                <p className="text-xs font-semibold text-ink">{alert.title}</p>
                <p className="text-sm text-muted">{alert.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">Routes</p>
            <Link href={role.homeHref} className="text-[10px] font-semibold text-primary hover:underline">{role.label}</Link>
          </div>
          <div className="space-y-1">
            {page.relatedLinks.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-lg border border-line px-3 py-2 transition hover:border-primary/30 hover:bg-primary-soft/30">
                <p className="text-xs font-semibold text-primary">{link.title}</p>
                <p className="text-sm text-muted">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}