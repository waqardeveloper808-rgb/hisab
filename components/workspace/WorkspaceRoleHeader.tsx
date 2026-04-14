import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

type WorkspaceRoleHeaderAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "tertiary" | "muted";
};

type WorkspaceRoleHeaderFocus = {
  label: string;
  detail: string;
};

export function WorkspaceRoleHeader({
  eyebrow,
  title,
  description,
  actions,
  focusAreas,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions: WorkspaceRoleHeaderAction[];
  focusAreas: WorkspaceRoleHeaderFocus[];
}) {
  return (
    <div className="space-y-5">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">{title}</h1>
            <p className="mt-4 text-base leading-7 text-muted">{description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <Button key={action.href} href={action.href} variant={action.variant ?? "secondary"}>
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        {focusAreas.map((area) => (
          <Card key={area.label} className="rounded-[1.6rem] bg-white/92 p-5">
            <p className="text-sm font-semibold text-primary">{area.label}</p>
            <p className="mt-3 text-sm leading-6 text-muted">{area.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}