import type { ReactNode } from "react";
import { BrandMark } from "@/components/BrandMark";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  checklist: string[];
  children: ReactNode;
  contentClassName?: string;
  panelClassName?: string;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  checklist,
  children,
  contentClassName = "",
  panelClassName = "",
}: AuthShellProps) {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <Container>
        <div className={["grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center", contentClassName].filter(Boolean).join(" ")}>
          <div className="mx-auto w-full max-w-lg lg:mx-0">
            <BrandMark />
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-brand">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-muted">
              {description}
            </p>
            <div className="mt-8 space-y-3">
              {checklist.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-[0_12px_26px_-24px_rgba(11,11,11,0.12)]"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-md text-sm leading-6 text-muted">
              Built for Saudi businesses that want ZATCA-compliant invoicing they can understand in seconds.
            </p>
          </div>

          <Card className={["mx-auto w-full max-w-lg border-brand/15 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(245,245,245,0.98))] p-6 shadow-[0_36px_90px_-44px_rgba(11,11,11,0.16)] sm:p-8", panelClassName].filter(Boolean).join(" ")}>
            {children}
          </Card>
        </div>
      </Container>
    </section>
  );
}