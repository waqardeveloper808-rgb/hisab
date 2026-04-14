import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { businessStats, productModules, reportsModule, trustSignals } from "@/data/product";
import { buildWhatsAppHref, getProductConfig } from "@/lib/product-config";

const heroSteps = [
  {
    title: "Create and send faster",
    description: "A guided invoice flow replaces scattered templates, manual totals, and last-minute document fixes.",
  },
  {
    title: "Keep VAT attached to every invoice",
    description: "VAT stays visible while you work, so reporting is not a separate spreadsheet exercise at the end of the month.",
  },
  {
    title: "Stay ready for ZATCA checks",
    description: "Numbering, company data, and reporting stay aligned with the Saudi compliance flow your team actually needs.",
  },
];

const pricingCards = [
  {
    title: "45-Day Free Trial",
    price: "0 SAR",
    caption: "Validate the full invoicing workflow before paying anything.",
    details: ["Full product access", "WhatsApp support included", "Designed for a real production trial"],
    tone: "default",
    badge: "Start here",
    cta: "Start Free Trial",
  },
  {
    title: "Plus Plan",
    price: "40 SAR",
    caption: "Continue with a simple monthly plan once invoicing becomes part of the weekly routine.",
    details: ["Ongoing invoicing and VAT flow", "Reports and compliance support", "No complicated upgrade path"],
    tone: "featured",
    badge: "Recommended",
    cta: "Choose Plus Plan",
  },
] as const;

const helpCards = [
  {
    title: "AI assistant for quick answers",
    description: "Users can resolve routine questions inside the product instead of waiting for a long support chain.",
  },
  {
    title: "WhatsApp support when the issue is urgent",
    description: "When a business needs help with invoicing or reporting, support stays one message away.",
  },
  {
    title: "A clear path from setup to sending",
    description: "The public experience, the workspace, and the help flow now tell the same product story without mixed signals.",
  },
];

export default async function Home() {
  const productConfig = await getProductConfig();
  const supportHref = buildWhatsAppHref(productConfig.supportWhatsappNumber);
  const modules = [...productModules, reportsModule];

  return (
    <div className="landing-scroll">
      <section id="hero" className="landing-section overflow-hidden px-0 py-8 sm:py-10">
        <Container className="w-full">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <LandingReveal className="max-w-2xl">
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-ink sm:text-[3.9rem] sm:leading-[0.96]">
                ZATCA invoicing that feels ready the moment your team opens it.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
                Gulf Hisab gives Saudi businesses one clean path: create the invoice, keep VAT visible, send faster, and stay ready for compliance without rebuilding the process every month.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href="/register?plan=zatca-monthly" size="lg">
                  Start Free Trial
                </Button>
                <a
                  href={supportHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#cfe5d7] bg-white px-5 py-3 text-sm font-semibold text-ink shadow-[0_14px_30px_-24px_rgba(17,32,24,0.16)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary sm:px-6 sm:py-3.5"
                >
                  WhatsApp Support
                </a>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {businessStats.map((item) => (
                  <div key={item.label} className="rounded-[1.5rem] border border-line bg-white/92 px-4 py-4 shadow-[0_18px_36px_-26px_rgba(17,32,24,0.12)]">
                    <p className="text-lg font-semibold text-ink">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{item.label}</p>
                  </div>
                ))}
              </div>
            </LandingReveal>

            <LandingReveal>
              <Card className="overflow-hidden border-[#d7eadf] bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(241,249,244,0.96)_58%,rgba(255,243,224,0.94))] p-7 lg:p-8">
                <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
                  <div>
                    <p className="text-sm font-medium text-muted">Operating model</p>
                    <h2 className="mt-1 text-xl font-semibold text-ink">One business flow from invoice draft to reporting day.</h2>
                  </div>
                  <div className="rounded-full border border-[#d7eadf] bg-white px-3 py-1 text-sm font-semibold text-primary">
                    Ready to demo
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {heroSteps.map((step, index) => (
                    <div key={step.title} className="rounded-[1.5rem] border border-line bg-white/92 p-4 shadow-[0_14px_30px_-24px_rgba(17,32,24,0.12)]">
                      <div className="flex items-start gap-3">
                        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white">{index + 1}</span>
                        <div>
                          <p className="text-base font-semibold text-ink">{step.title}</p>
                          <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {trustSignals.slice(0, 4).map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-ink shadow-[0_10px_24px_-20px_rgba(17,32,24,0.08)]">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </LandingReveal>
          </div>
        </Container>
      </section>

      <section id="products" className="landing-section px-0 py-10 sm:py-12">
        <Container className="w-full">
          <LandingReveal className="mx-auto max-w-3xl text-center">
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-ink sm:text-[3rem]">
              Four product promises and one reporting layer. No filler modules.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
              The homepage now explains Gulf Hisab the way a buyer scans it: invoicing, VAT, compliance, support, and reporting arranged as one connected system.
            </p>
          </LandingReveal>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {modules.map((module, index) => (
              <LandingReveal key={module.title} className={index === modules.length - 1 ? "xl:col-span-1" : ""}>
                <Card className={["group flex h-full flex-col bg-white", index === modules.length - 1 ? "border-primary/20 shadow-[0_24px_52px_-34px_rgba(31,122,83,0.18)]" : "hover:-translate-y-1 hover:shadow-[0_24px_50px_-34px_rgba(17,32,24,0.16)]"].join(" ")}>
                  <div>
                    <div className="h-1 w-16 rounded-full bg-primary/16" />
                    <h3 className="mt-5 text-2xl font-semibold text-ink">{module.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted">{module.shortDescription}</p>
                  </div>
                  <div className="mt-5 rounded-[1.35rem] border border-line bg-surface-soft px-4 py-4">
                    <p className="text-sm font-medium text-ink">{module.benefit}</p>
                  </div>
                  <div className="mt-6 space-y-3">
                    {module.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-ink shadow-[0_10px_24px_-20px_rgba(17,32,24,0.08)]">
                        <span className="flex size-6 items-center justify-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </Container>
      </section>

      <section id="pricing" className="landing-section px-0 py-10 sm:py-12">
        <Container className="w-full">
          <LandingReveal className="mx-auto max-w-3xl text-center">
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-ink sm:text-[3rem]">
              A two-step pricing path buyers can understand in a few seconds.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
              Start with {productConfig.freeTrialDays} days of full access. Move to the {productConfig.paidPlanMonthlyPriceSar} SAR Plus Plan when the invoicing flow is already proven in your business.
            </p>
          </LandingReveal>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {pricingCards.map((card) => (
              <LandingReveal key={card.title}>
                <Card className={card.tone === "featured" ? "border-primary/30 bg-white shadow-[0_28px_72px_-40px_rgba(17,163,110,0.24)]" : "bg-white"}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{card.title}</p>
                    {card.badge ? (
                      <span className="rounded-full border border-primary-border bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        {card.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-4xl font-semibold text-ink">{card.title === "Plus Plan" ? `${productConfig.paidPlanMonthlyPriceSar} SAR` : card.price}</p>
                  <p className="mt-3 text-sm leading-6 text-muted">{card.caption}</p>
                  <div className="mt-6 space-y-3">
                    {card.details.map((detail) => (
                      <div key={detail} className="flex items-center gap-3 rounded-2xl bg-surface-soft px-4 py-3 text-sm text-ink">
                        <span className="flex size-6 items-center justify-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">✓</span>
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button href="/register?plan=zatca-monthly" variant={card.tone === "featured" ? "primary" : "secondary"} size="lg" className="sm:flex-1">
                      {card.cta}
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
              </LandingReveal>
            ))}
          </div>
        </Container>
      </section>

      <section id="help" className="landing-section px-0 py-10 sm:py-12">
        <Container className="w-full">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <LandingReveal className="max-w-xl">
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-ink sm:text-[3rem]">
                Support is part of the conversion story, not a buried afterthought.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
                The landing experience ends with clear help options so buyers know how they will get answers during onboarding, setup, and day-to-day invoicing.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href="/register?plan=zatca-monthly" size="lg">
                  Start Free Trial
                </Button>
                <a
                  href={supportHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#cfe5d7] bg-white px-5 py-3 text-sm font-semibold text-ink shadow-[0_14px_30px_-24px_rgba(17,32,24,0.16)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary sm:px-6 sm:py-3.5"
                >
                  WhatsApp Support
                </a>
              </div>
            </LandingReveal>

            <div className="grid gap-5 md:grid-cols-3">
              {helpCards.map((card) => (
                <LandingReveal key={card.title}>
                  <Card className="flex h-full flex-col bg-white">
                    <div className="h-1 w-16 rounded-full bg-primary/18" />
                    <h3 className="mt-5 text-xl font-semibold text-ink">{card.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted">{card.description}</p>
                  </Card>
                </LandingReveal>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}