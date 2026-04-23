import { Button } from "@/components/Button";

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
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-white px-3 py-1.5">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary">{eyebrow}</p>
          <h1 className="text-base font-semibold text-ink">{title}</h1>
          <p className="text-[11px] text-muted truncate">{description}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {actions.slice(0, 3).map((action) => (
            <Button key={action.href} href={action.href} size="xs" variant={action.variant ?? "secondary"}>
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {focusAreas.length > 0 ? (
        <div className="grid gap-1.5 md:grid-cols-3">
          {focusAreas.map((area) => (
            <div key={area.label} className="rounded border border-line bg-white px-2.5 py-1.5">
              <p className="text-[10px] font-semibold text-primary">{area.label}</p>
              <p className="text-[10px] text-muted">{area.detail}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}