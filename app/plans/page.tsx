import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { SectionHeader } from "@/components/SectionHeader";
import { buildWhatsAppHref, getProductConfig } from "@/lib/product-config";

const standalonePlans = [
  {
    name: "45-Day Free Trial",
    price: "0 SAR",
    description: "Use the full invoicing, VAT, reporting, and support flow before you commit.",
    highlight: false,
    badge: "Start here",
    cta: "Start Free Trial",
    features: ["Full workspace access", "WhatsApp support included", "Built for a real business test"],
  },
  {
    name: "Plus Plan",
    price: "40 SAR",
    description: "Move into a stable monthly plan once invoicing becomes a weekly business routine.",
    highlight: true,
    badge: "Recommended",
    cta: "Choose Plus Plan",
    features: ["Ongoing invoicing and VAT", "ZATCA-focused reporting", "Simple monthly billing"],
  },
] as const;

export const metadata = {
  title: "Plans",
};

export default async function PlansPage() {
  const productConfig = await getProductConfig();
  const supportHref = buildWhatsAppHref(productConfig.supportWhatsappNumber);

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeader
          eyebrow="Pricing"
          title="Simple pricing for a ZATCA-focused invoicing product."
          description="The pricing story is now deliberate: start with the trial, validate the workflow, then move to one monthly plan when the business is ready."
          align="center"
          titleAs="h1"
        />

        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-line bg-white p-1.5 shadow-[0_14px_30px_-28px_rgba(17,32,24,0.16)]">
            <span className="rounded-full bg-primary-soft px-4 py-2 text-sm font-semibold text-ink">{productConfig.freeTrialDays}-day trial</span>
            <span className="px-4 py-2 text-sm text-muted">Then {productConfig.paidPlanMonthlyPriceSar} SAR monthly</span>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2 lg:items-stretch">
          {standalonePlans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlight ? "relative border-primary/35 bg-white shadow-[0_28px_78px_-42px_rgba(31,122,83,0.28)] lg:-translate-y-2" : "bg-white"}
            >
              {plan.highlight ? (
                <div className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-primary" />
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-ink">{plan.name}</h2>
                {plan.badge ? (
                  <span className="rounded-full border border-primary-border bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    {plan.badge}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{plan.description}</p>
              <div className="mt-4 rounded-2xl bg-surface-soft px-4 py-3 text-sm text-ink">
                <span className="font-semibold">Best for:</span> {plan.name === "45-Day Free Trial" ? "Evaluating the full invoicing flow" : "Running invoicing every week"}
              </div>
              <div className="mt-6 rounded-[1.4rem] border border-line bg-surface-soft px-5 py-5">
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-semibold text-ink">{plan.name === "Plus Plan" ? `${productConfig.paidPlanMonthlyPriceSar} SAR` : plan.price}</span>
                  <span className="pb-1 text-sm text-muted">{plan.name === "Plus Plan" ? "/ month" : "during trial"}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{plan.name === "45-Day Free Trial" ? `Full access for ${productConfig.freeTrialDays} days.` : `Simple monthly pricing at ${productConfig.paidPlanMonthlyPriceSar} SAR.`}</p>
              </div>
              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-ink shadow-[0_10px_24px_-20px_rgba(17,32,24,0.08)]">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href="/register?plan=zatca-monthly" variant={plan.highlight ? "primary" : "secondary"} size="lg" className="sm:flex-1">
                  {plan.cta}
                </Button>
                <a
                  href={supportHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#cfe5d7] bg-white px-5 py-3 text-sm font-semibold text-ink shadow-[0_14px_30px_-24px_rgba(17,32,24,0.16)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary sm:flex-1 sm:px-6 sm:py-3.5"
                >
                  WhatsApp Support
                </a>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-[1.9rem] border border-line bg-white shadow-[0_18px_40px_-34px_rgba(17,32,24,0.12)]">
          <div className="grid gap-0 border-b border-line bg-surface-soft md:grid-cols-[1.1fr_repeat(2,1fr)]">
            <div className="px-5 py-4 text-sm font-semibold text-ink">Plan detail</div>
            <div className="px-5 py-4 text-sm font-semibold text-ink">45-Day Free Trial</div>
            <div className="px-5 py-4 text-sm font-semibold text-ink">Plus Plan</div>
          </div>
          {[
            ["Access window", `${productConfig.freeTrialDays} days of full access`, "Ongoing monthly access"],
            ["Who it fits", "Businesses validating the workflow", "Businesses invoicing every week"],
            ["Support", "WhatsApp support included", "WhatsApp support with ongoing use"],
            ["Decision point", "Adopt after testing the live flow", `Continue at ${productConfig.paidPlanMonthlyPriceSar} SAR per month`],
          ].map(([label, left, right]) => (
            <div key={label} className="grid border-b border-line last:border-b-0 md:grid-cols-[1.1fr_repeat(2,1fr)]">
              <div className="bg-white px-5 py-4 text-sm font-semibold text-ink">{label}</div>
              <div className="px-5 py-4 text-sm text-muted">{left}</div>
              <div className="px-5 py-4 text-sm text-muted">{right}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[1.85rem] border border-line bg-[linear-gradient(145deg,rgba(19,109,76,0.98),rgba(16,95,67,0.96)_55%,rgba(29,125,87,0.94))] px-6 py-8 text-white shadow-[0_28px_64px_-34px_rgba(9,69,48,0.55)] sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Need help deciding which path matches your invoicing volume?</h2>
              <p className="mt-3 text-sm leading-6 text-white/78 sm:text-base">
                Talk to support, map the workflow to your current invoicing process, and start the trial with a cleaner expectation of what the monthly plan covers.
              </p>
            </div>
            <a
              href={supportHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-[#0f5f43] shadow-[0_14px_30px_-24px_rgba(9,69,48,0.42)] transition hover:-translate-y-0.5 hover:bg-[#f4fbf7] sm:px-6 sm:py-3.5"
            >
              WhatsApp Support
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}