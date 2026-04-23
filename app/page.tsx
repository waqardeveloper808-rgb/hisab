import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { buildWhatsAppHref, getProductConfig } from "@/lib/product-config";

const valueBlocks = [
  {
    title: "Operational breadth",
    description: "Run invoicing, accounting, inventory, VAT, and reporting from one connected platform instead of stitching tools together.",
  },
  {
    title: "Workflow continuity",
    description: "Keep one path from create to send to follow-up to reporting without breaking context between screens.",
  },
  {
    title: "Compliance clarity",
    description: "Keep ZATCA, VAT fields, company data, and reporting structure visible before documents are finalized.",
  },
  {
    title: "Support built in",
    description: "Use help content, feature requests, system status, and WhatsApp support without leaving the product story.",
  },
];

const workflowBlocks = [
  {
    title: "Create",
    caption: "Build the document with customer, items, VAT, and company profile already attached.",
  },
  {
    title: "Send",
    caption: "Move into a customer-ready document with cleaner layout, numbering, and template control.",
  },
  {
    title: "Track",
    caption: "Keep balance, payment state, shortages, and next-step guidance visible while work is active.",
  },
  {
    title: "Report",
    caption: "Carry the same transaction into journals, VAT, and reporting instead of rebuilding it later.",
  },
];

const trustPillars = [
  "ZATCA-compliant document flow",
  "Structured finance and VAT records",
  "Inventory and invoice continuity",
  "WhatsApp and guided support",
];

export default async function Home() {
  const productConfig = await getProductConfig();
  const supportHref = buildWhatsAppHref(productConfig.supportWhatsappNumber);

  return (
    <div className="landing-scroll bg-[radial-gradient(circle_at_top_left,rgba(31,122,83,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(255,240,214,0.92),transparent_26%)]">
      <section id="hero" className="landing-section overflow-hidden px-0 py-14 sm:py-16 lg:py-18">
        <Container className="w-full">
          <div className="grid gap-8 lg:grid-cols-[1.03fr_0.97fr] lg:items-center xl:gap-12">
            <LandingReveal className="max-w-[44rem]">
              <div className="inline-flex items-center gap-3 rounded-full border border-primary-border bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary shadow-xs">
                <img src="/branding/gulf-hisab-compact-logo.svg" alt="Gulf Hisab compact mark" className="h-5 w-5" />
                Gulf Hisab
              </div>
              <h1 className="mt-5 max-w-[13ch] text-[2.35rem] font-semibold tracking-tight text-ink sm:text-[3rem] sm:leading-[1.04] lg:text-[3.55rem] lg:leading-[1.06]">
                ZATCA-compliant business finance platform for invoicing, accounting, VAT, reporting, and workflows.
              </h1>
              <p className="mt-5 max-w-2xl text-[0.99rem] leading-7 text-muted sm:text-[1.03rem] sm:leading-8">
                Gulf Hisab gives finance teams one clean path to create, send, track, and report without switching between disconnected invoicing, accounting, VAT, and support tools.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button href="/register?plan=zatca-monthly" size="lg">
                  Start Free Trial
                </Button>
                <Button href="/login" size="lg" variant="secondary">
                  Login
                </Button>
                <a
                  href={supportHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-primary-border bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-xs transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
                >
                  WhatsApp Support
                </a>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                {process.env.NODE_ENV !== "production" ? (
                  <Button href="/workspace/user" size="md" variant="secondary">
                    Enter Workspace
                  </Button>
                ) : null}
                <Button href="/system/master-design" size="md" variant="tertiary">
                  Open System Monitor
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink">{productConfig.freeTrialDays}-day trial</span>
                <span className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink">{productConfig.paidPlanMonthlyPriceSar} SAR monthly</span>
                <span className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink">Direct WhatsApp support</span>
              </div>
            </LandingReveal>

            <LandingReveal>
              <Card className="overflow-hidden border-[#d7eadf] bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(241,249,244,0.96)_58%,rgba(255,243,224,0.94))] p-5 lg:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <img src="/branding/gulf-hisab-main-logo.svg" alt="Gulf Hisab" className="h-8 w-auto object-contain opacity-90" />
                    <h2 className="mt-4 text-[1.55rem] font-semibold leading-[1.25] text-ink">Structured workflow your team can trust from first invoice to final report</h2>
                  </div>
                  <div className="rounded-full border border-[#d7eadf] bg-white px-2.5 py-0.5 text-xs font-semibold text-primary">
                    Ready
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {workflowBlocks.map((step, index) => (
                    <div key={step.title} className="rounded-2xl border border-line bg-white/95 p-4 shadow-xs">
                      <div className="flex items-start gap-3">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">{index + 1}</span>
                        <div>
                          <p className="text-sm font-semibold text-ink">{step.title}</p>
                          <p className="mt-1 text-sm leading-6 text-muted">{step.caption}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {trustPillars.map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-ink shadow-xs">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary-soft text-[9px] font-bold text-primary">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </LandingReveal>
          </div>
        </Container>
      </section>

      <section id="products" className="landing-section px-0 py-14 sm:py-16">
        <Container className="w-full">
          <LandingReveal className="mx-auto max-w-3xl text-center">
            <h2 className="mt-4 text-[2rem] font-semibold tracking-tight text-ink sm:text-[2.6rem] sm:leading-[1.12]">
              Why teams choose Gulf Hisab over disconnected finance tools.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted sm:text-lg sm:leading-8">
              The platform combines operational breadth, workflow continuity, compliance clarity, and live support in one finance operating surface.
            </p>
          </LandingReveal>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {valueBlocks.map((module) => (
              <LandingReveal key={module.title}>
                <Card className="group flex h-full flex-col rounded-[2rem] bg-white p-6 hover:-translate-y-0.5 hover:shadow-card">
                  <div>
                    <div className="h-0.5 w-10 rounded-full bg-primary/16" />
                    <h3 className="mt-3 text-lg font-semibold text-ink">{module.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted">{module.description}</p>
                  </div>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </Container>
      </section>

      <section id="pricing" className="landing-section px-0 py-14 sm:py-16">
        <Container className="w-full">
          <LandingReveal>
            <Card className="rounded-[2rem] bg-white p-8 shadow-elevated lg:p-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Pricing preview</p>
                  <h2 className="mt-4 text-[2rem] font-semibold tracking-tight text-ink sm:text-[2.65rem]">Simple commercial terms for a complete finance platform.</h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">Start with a {productConfig.freeTrialDays}-day trial to validate the full workflow, then continue at {productConfig.paidPlanMonthlyPriceSar} SAR per month for ongoing operational use.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-primary-border bg-primary-soft p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Free trial</p>
                    <p className="mt-3 text-4xl font-semibold text-ink">{productConfig.freeTrialDays} days</p>
                    <p className="mt-3 text-sm leading-6 text-muted">Full access to validate invoicing, VAT visibility, and reporting flow.</p>
                  </div>
                  <div className="rounded-[1.75rem] border border-line bg-white p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Plus plan</p>
                    <p className="mt-3 text-4xl font-semibold text-ink">{productConfig.paidPlanMonthlyPriceSar} SAR</p>
                    <p className="mt-3 text-sm leading-6 text-muted">A simple monthly price for a real production workflow.</p>
                  </div>
                </div>
              </div>
            </Card>
          </LandingReveal>
        </Container>
      </section>

      <section id="help" className="landing-section px-0 py-12 sm:py-14">
        <Container className="w-full">
          <LandingReveal>
            <div className="rounded-[2rem] bg-ink px-6 py-8 text-white shadow-elevated sm:px-9 sm:py-9">
              <h2 className="max-w-3xl text-[1.8rem] font-semibold tracking-tight leading-[1.22] sm:text-[2.15rem] sm:leading-[1.24]">Move into a cleaner finance workflow with invoicing, accounting, VAT, and support already connected.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78 sm:text-base">Start the trial, validate the workflow, and keep direct support available while your team moves from setup into live documents and reporting.</p>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <Button href="/register?plan=zatca-monthly" size="lg" className="!min-h-[2.9rem] !bg-white !px-4 !py-2 !text-[0.92rem] !text-ink hover:!bg-white/90">Start Free Trial</Button>
                <a href={supportHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-[0.92rem] font-semibold leading-6 text-white transition hover:-translate-y-0.5 hover:bg-white/10">WhatsApp Support</a>
              </div>
            </div>
          </LandingReveal>
        </Container>
      </section>
    </div>
  );
}