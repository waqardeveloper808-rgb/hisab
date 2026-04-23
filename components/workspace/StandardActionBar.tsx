import { Button } from "@/components/Button";

type ActionItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "tertiary" | "muted";
};

export function StandardActionBar({ actions, compact = false }: { actions: ActionItem[]; compact?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5" data-inspector-action-bar="true">
      {actions.map((action, index) => (
        <Button
          key={`${action.label}-${index}`}
          size={compact ? "xs" : "sm"}
          variant={action.variant ?? (action.label === "Save" ? "primary" : "secondary")}
          href={action.href}
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}