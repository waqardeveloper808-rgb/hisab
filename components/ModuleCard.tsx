import { Card } from "@/components/Card";

type ModuleCardProps = {
  title: string;
  icon?: string;
  summary: string;
  benefit: string;
  features: string[];
  emphasis?: "default" | "strong";
};

export function ModuleCard({
  title,
  summary,
  benefit,
  features,
  emphasis = "default",
}: ModuleCardProps) {
  return (
    <Card
      className={[
        "group flex h-full flex-col bg-white",
        emphasis === "strong"
          ? "border-primary/20 shadow-[0_24px_52px_-34px_rgba(31,122,83,0.18)]"
          : "hover:-translate-y-1 hover:shadow-[0_24px_50px_-34px_rgba(17,32,24,0.16)]",
      ].join(" ")}
    >
      <div>
        <div className="h-1 w-16 rounded-full bg-primary/16" />
        <h3 className="mt-5 text-2xl font-semibold text-ink">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-muted">{summary}</p>
      </div>

      <div className="mt-5 rounded-[1.35rem] border border-line bg-surface-soft px-4 py-4">
        <p className="text-sm font-medium text-ink">{benefit}</p>
      </div>

      <div className="mt-6 space-y-3">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-ink shadow-[0_10px_24px_-20px_rgba(17,32,24,0.08)]">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
              ✓
            </span>
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}