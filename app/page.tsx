import { ArrowRight, BadgeCheck, Building2, FileSpreadsheet, MessageCircleMore, ShieldCheck } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { BrandMark } from "@/components/BrandMark";
import { Container } from "@/components/Container";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { appName } from "@/lib/brand";
import { buildWhatsAppHref, getProductConfig } from "@/lib/product-config";

const pricingBlocks = [
  {
    title: "Start plan",
    caption: "Free trial",
    description: "Validate invoicing, VAT review, customer documents, and reporting in the same live workflow.",
  },
  {
    title: "Operational plan",
    caption: "Per month",
    description: "Keep the same workflow live for production invoicing, collections, VAT visibility, and finance reporting.",
  },
];

const moduleBlocks = [
  {
    title: "Sales and billing",
    description: "Create quotations, proforma invoices, tax invoices, credit notes, and debit notes with a connected customer workflow.",
  },
  {
    title: "Accounting and VAT",
    description: "Keep journal, ledger, receivables, payables, and VAT review connected to the original transaction.",
  },
  {
    title: "Inventory and products",
    description: "Manage products, stock movement, service items, and item-level pricing without leaving the workspace.",
  },
  {
    title: "Support and help desk",
    description: "Use WhatsApp support, searchable FAQs, and guided help when setup or operations need a human answer.",
  },
];

const trustBlocks = [
  {
    title: "ZATCA-ready document flow",
    description: "The platform is framed around Saudi invoicing expectations, company identity, VAT fields, and document continuity.",
    icon: ShieldCheck,
  },
  {
    title: "High-density workspace",
    description: "Registers, previews, and actions stay visible together so users can review and act without dead-end navigation.",
    icon: FileSpreadsheet,
  },
  {
    title: "One operational surface",
    description: "Sales, accounting, settings, reports, and support stay connected instead of breaking into disconnected pages.",
    icon: Building2,
  },
  {
    title: "Direct support path",
    description: "When setup or invoicing stalls, WhatsApp support and the help center remain one click away.",
    icon: MessageCircleMore,
  },
];

const faqItems = [
  {
    question: "How does Hisabix help with ZATCA-compliant invoicing?",
    answer: "It keeps company identity, VAT information, document output, and the invoice lifecycle visible inside one billing workflow.",
  },
  {
    question: "Can finance teams review VAT and reports from the same workspace?",
    answer: "Yes. The same workspace exposes VAT summaries, accounting reports, customer balances, and payment status without exporting to separate tools.",
  },
  {
    question: "What happens after signup?",
    answer: "Users create an account, complete company setup, upload brand assets, and then enter the live workspace with settings ready for invoicing.",
  },
  {
    question: "How do users get support during setup or daily usage?",
    answer: "The platform includes a searchable help center, in-workspace help routes, and direct WhatsApp support for faster issue resolution.",
  },
];

export default async function Home() {
  const productConfig = await getProductConfig();
  const supportHref = buildWhatsAppHref(productConfig.supportWhatsappNumber);
  const resolvedPricingBlocks = [
    { ...pricingBlocks[0], price: "0 SAR" },
    { ...pricingBlocks[1], price: `${productConfig.paidPlanMonthlyPriceSar} SAR` },
  ];

  return (
    <div className="landing-scroll bg-[radial-gradient(circle_at_top_left,rgba(63,174,42,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,245,245,0.96),transparent_26%)]">
      <section id="hero" className="landing-section overflow-hidden px-0 py-14 sm:py-16 lg:py-18">
        <Container className="w-full">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center xl:gap-12">
            <LandingReveal className="max-w-[44rem]">
              <BrandMark imageClassName="h-14 md:h-16" />
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary-border bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary shadow-xs">
                <BadgeCheck className="h-4 w-4" />
                ZATCA-focused SaaS workspace
              </div>
              <h1 className="mt-5 max-w-[14ch] text-[2.35rem] font-semibold tracking-tight text-ink sm:text-[3rem] sm:leading-[1.04] lg:text-[3.55rem] lg:leading-[1.06]">
                Run invoicing, VAT review, accounting, and customer documents from one professional workspace.
              </h1>
              <p className="mt-5 max-w-2xl text-[0.99rem] leading-7 text-muted sm:text-[1.03rem] sm:leading-8">
                {appName} gives finance teams a clean operational path from draft to issue to collection to reporting, with company setup and support built into the same product surface.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
                  WhatsApp support
                </a>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button href="/workspace/user" size="md" variant="secondary">
                  Open workspace
                </Button>
                {process.env.NODE_ENV !== "production" ? (
                  <Button href="/workspace/user" size="md" variant="tertiary">
                    Workspace (/workspace/user)
                  </Button>
                ) : null}
              </div>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink">{productConfig.freeTrialDays}-day trial</span>
                <span className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink">{productConfig.paidPlanMonthlyPriceSar} SAR monthly</span>
                <span className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink">Company onboarding included</span>
              </div>
            </LandingReveal>

            <LandingReveal>
              <Card className="overflow-hidden border-primary-border bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(245,245,245,0.96)_58%,rgba(91,198,63,0.08))] p-5 lg:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Workflow sequence</p>
                    <h2 className="mt-2 text-[1.55rem] font-semibold leading-[1.25] text-ink">A finance workflow built for action, not oversized dashboards.</h2>
                  </div>
                  <div className="rounded-full border border-primary-border bg-white px-2.5 py-0.5 text-xs font-semibold text-primary">Live</div>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    "Create the document with customer, items, VAT, and company defaults already connected.",
                    "Preview, edit, print, download, and send from the same workspace without duplicate panels.",
                    "Track balance, payment state, and document history while keeping the register visible.",
                    "Move straight into accounting, VAT, and reports without rebuilding the transaction.",
                  ].map((step, index) => (
                    <div key={step} className="rounded-2xl border border-line bg-white/95 p-4 shadow-xs">
                      <div className="flex items-start gap-3">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">{index + 1}</span>
                        <div>
                          <p className="text-sm leading-6 text-muted">{step}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {["Invoice register with preview actions", "Company onboarding before workspace access", "VAT and accounting continuity", "Searchable help and WhatsApp support"].map((item) => (
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

      <section id="pricing" className="landing-section px-0 py-14 sm:py-16">
        <Container className="w-full">
          <LandingReveal>
            <div className="grid gap-5 lg:grid-cols-2">
              {resolvedPricingBlocks.map((plan, index) => (
                <Card key={plan.title} className={["bg-white p-6", index === 1 ? "border-primary/30 shadow-[0_22px_48px_-30px_rgba(63,174,42,0.24)]" : ""].join(" ")}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{plan.title}</p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-4xl font-semibold text-ink">{plan.price}</span>
                    <span className="pb-1 text-sm text-muted">{plan.caption}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted">{plan.description}</p>
                  <div className="mt-5 flex gap-2">
                    <Button href="/register?plan=zatca-monthly" size="md">{index === 0 ? "Start free trial" : "Choose plan"}</Button>
                    <Button href="/plans" size="md" variant="secondary">View details</Button>
                  </div>
                </Card>
              ))}
            </div>
          </LandingReveal>
        </Container>
      </section>

      <section id="modules" className="landing-section px-0 py-14 sm:py-16">
        <Container className="w-full">
          <LandingReveal className="mx-auto max-w-3xl text-center">
            <h2 className="mt-4 text-[2rem] font-semibold tracking-tight text-ink sm:text-[2.6rem] sm:leading-[1.12]">
              Core modules for the full business workflow.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted sm:text-lg sm:leading-8">
              The product stays focused on the operational routes finance teams use every day, with less decoration and more usable data density.
            </p>
          </LandingReveal>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {moduleBlocks.map((module) => (
              <LandingReveal key={module.title}>
                <Card className="group flex h-full flex-col rounded-[1.5rem] bg-white p-5 hover:-translate-y-0.5 hover:shadow-card">
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

      <section id="trust" className="landing-section px-0 py-14 sm:py-16">
        <Container className="w-full">
          <LandingReveal>
            <Card className="rounded-[2rem] bg-white p-8 shadow-elevated lg:p-10">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {trustBlocks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-[1.25rem] border border-line bg-surface-soft/35 p-5">
                      <span className="inline-flex rounded-xl bg-white p-2 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-3 text-lg font-semibold text-ink">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </LandingReveal>
        </Container>
      </section>

      <section id="faq" className="landing-section px-0 py-12 sm:py-14">
        <Container className="w-full">
          <LandingReveal>
            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <Card className="bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">FAQ</p>
                <h2 className="mt-3 text-2xl font-semibold text-ink">Answers for finance teams evaluating the workflow.</h2>
                <div className="mt-5 space-y-3">
                  {faqItems.map((entry) => (
                    <div key={entry.question} className="rounded-xl border border-line bg-surface-soft/35 p-4">
                      <p className="text-sm font-semibold text-ink">{entry.question}</p>
                      <p className="mt-2 text-sm leading-6 text-muted">{entry.answer}</p>
                    </div>
                  ))}
                </div>
              </Card>
              <div className="rounded-[2rem] bg-ink px-6 py-8 text-white shadow-elevated sm:px-9 sm:py-9">
                <h2 className="max-w-3xl text-[1.8rem] font-semibold tracking-tight leading-[1.22] sm:text-[2.15rem] sm:leading-[1.24]">Move from signup to company setup to a ready workspace without broken handoffs.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78 sm:text-base">Start the trial, complete the company profile, and enter a workspace that is already prepared for invoicing, previews, support, and reporting.</p>
                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                  <Button href="/register?plan=zatca-monthly" size="lg" className="!min-h-[2.9rem] !bg-white !px-4 !py-2 !text-[0.92rem] !text-ink hover:!bg-white/90">
                    Start free trial
                  </Button>
                  <a href={supportHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-[0.92rem] font-semibold leading-6 text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                    WhatsApp support
                  </a>
                </div>
                <a href="/helpdesk-ai" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white">
                  Open help center
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </LandingReveal>
        </Container>
      </section>
    </div>
  );
}