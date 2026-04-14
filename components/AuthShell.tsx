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
};

export function AuthShell({
  eyebrow,
  title,
  description,
  checklist,
  children,
}: AuthShellProps) {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
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
                  className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-[0_12px_26px_-24px_rgba(17,32,24,0.14)]"
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

          <Card className="mx-auto w-full max-w-lg border-brand/10 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(246,250,246,0.96))] p-6 shadow-[0_36px_90px_-44px_rgba(17,32,24,0.22)] sm:p-8">
            {children}
          </Card>
        </div>
      </Container>
    </section>
  );
}