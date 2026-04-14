import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import type { WorkspaceModulePageDefinition } from "@/data/role-workspace";
import { workspaceRoles } from "@/data/role-workspace";

export function WorkspaceModulePage({ page }: { page: WorkspaceModulePageDefinition }) {
  const role = workspaceRoles[page.role];

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{role.label}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">{page.title}</h1>
            <p className="mt-4 text-base leading-7 text-muted">{page.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {page.quickActions.map((action) => (
              <Button key={action.href} href={action.href} variant={action.variant ?? "secondary"}>
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.8rem] bg-white/92 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Operational status</p>
          <div className="mt-4 space-y-3">
            {page.alerts.map((alert) => (
              <div key={alert.title} className="rounded-[1.3rem] border border-line bg-surface-soft px-4 py-3">
                <p className="text-sm font-semibold text-ink">{alert.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{alert.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[1.8rem] bg-white/92 p-6">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink">Next valid routes</h2>
              <p className="mt-1 text-sm text-muted">Use shipped screens only. This route should not masquerade as a working register.</p>
            </div>
            <Link href={role.homeHref} className="text-sm font-semibold text-primary hover:text-primary-hover">
              Return to {role.label}
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {page.relatedLinks.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-[1.4rem] border border-line bg-surface-soft p-4 transition hover:border-primary/30 hover:bg-white">
                <p className="text-sm font-semibold text-primary">{link.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{link.description}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}