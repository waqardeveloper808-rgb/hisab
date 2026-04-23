import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { SectionHeader } from "@/components/SectionHeader";
import { buildWhatsAppHref, getProductConfig } from "@/lib/product-config";

const preSalesFaqs = [
  "What can I do during the trial? You can run invoicing, accounting, VAT review, reporting, and support workflows with the same product surface you would use after conversion.",
  "What happens after the trial? You move into the monthly plan when you want ongoing access without resetting the business setup.",
  "Is support included? Yes. WhatsApp support and guided help stay available during trial and paid use.",
  "Are there limits? The trial is time-limited. The paid plan is designed for ongoing operational use with the full finance workflow.",
];

const planScopeRows = [
  ["Trial explanation", "Use the real workflow before you commit", "Keep using the same workflow in production"],
  ["What unlocks", "Invoicing, accounting, VAT, reports, and support", "Ongoing access, stable monthly use, and live operations"],
  ["Support included", "WhatsApp support and guided help", "WhatsApp support and guided help"],
  ["Feature scope", "Full product validation across operations", "Full platform for ongoing daily finance work"],
  ["Usage limits", "Access window controlled by trial period", "Monthly operational access"],
];

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
          title="Simple pricing for a complete finance and invoicing platform"
          description="Start with a real trial, understand exactly what unlocks, and move into one clear paid plan when the business is ready for ongoing use."
          align="center"
          titleAs="h1"
        />

        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-line bg-white p-1.5 shadow-[0_14px_30px_-28px_rgba(17,32,24,0.16)]">
            <span className="rounded-full bg-primary-soft px-4 py-2 text-sm font-semibold text-ink">{productConfig.freeTrialDays}-day trial</span>
            <span className="px-4 py-2 text-sm text-muted">Then {productConfig.paidPlanMonthlyPriceSar} SAR monthly</span>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="bg-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">45-Day Free Trial</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Validate the full workflow before you pay.</h2>
              </div>
              <span className="rounded-full border border-primary-border bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Start here</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">Use invoices, accounting, VAT, reports, templates, and support so your team can test the real product instead of a cut-down demo.</p>
            <div className="mt-5 rounded-2xl border border-line bg-surface-soft px-5 py-5">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-semibold text-ink">0 SAR</span>
                <span className="pb-1 text-sm text-muted">for {productConfig.freeTrialDays} days</span>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-ink">
              <div className="rounded-2xl border border-line bg-white px-4 py-3">Create invoices, credit notes, debit notes, and customer documents.</div>
              <div className="rounded-2xl border border-line bg-white px-4 py-3">Review VAT, journals, and reports without leaving the same system.</div>
              <div className="rounded-2xl border border-line bg-white px-4 py-3">Use WhatsApp support, onboarding help, and feature guidance while validating fit.</div>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button href="/register?plan=zatca-monthly" size="lg" className="sm:flex-1">Start Free Trial</Button>
              <a href={supportHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-2xl border border-primary-border bg-white px-5 py-3 text-sm font-semibold text-ink shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary sm:flex-1 sm:px-6 sm:py-3.5">WhatsApp Support</a>
            </div>
          </Card>

          <Card className="relative border-primary/35 bg-white shadow-[0_28px_78px_-42px_rgba(31,122,83,0.28)] lg:-translate-y-2">
            <div className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-primary" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Plus Plan</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">One paid plan for ongoing operational use.</h2>
              </div>
              <span className="rounded-full border border-primary-border bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Recommended</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">Move into a clear monthly plan when the business is ready to keep invoicing, accounting, VAT review, and support active every week.</p>
            <div className="mt-5 rounded-2xl border border-line bg-surface-soft px-5 py-5">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-semibold text-ink">{productConfig.paidPlanMonthlyPriceSar} SAR</span>
                <span className="pb-1 text-sm text-muted">/ month</span>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-ink">
              <div className="rounded-2xl border border-line bg-white px-4 py-3">Ongoing invoicing, document workflows, and finance operations.</div>
              <div className="rounded-2xl border border-line bg-white px-4 py-3">Reports, VAT visibility, and journal continuity stay available.</div>
              <div className="rounded-2xl border border-line bg-white px-4 py-3">Support remains included so the team can keep working without escalation loops.</div>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button href="/register?plan=zatca-monthly" size="lg" className="sm:flex-1">Choose Plus Plan</Button>
              <a href={supportHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-2xl border border-primary-border bg-white px-5 py-3 text-sm font-semibold text-ink shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary sm:flex-1 sm:px-6 sm:py-3.5">Talk to support</a>
            </div>
          </Card>
        </div>

        <div className="mt-10 overflow-hidden rounded-xl border border-line bg-white shadow-[0_18px_40px_-34px_rgba(17,32,24,0.12)]">
          <div className="grid gap-0 border-b border-line bg-surface-soft md:grid-cols-[1.1fr_repeat(2,1fr)]">
            <div className="px-5 py-4 text-sm font-semibold text-ink">Plan detail</div>
            <div className="px-5 py-4 text-sm font-semibold text-ink">45-Day Free Trial</div>
            <div className="px-5 py-4 text-sm font-semibold text-ink">Plus Plan</div>
          </div>
          {planScopeRows.map(([label, left, right]) => (
            <div key={label} className="grid border-b border-line last:border-b-0 md:grid-cols-[1.1fr_repeat(2,1fr)]">
              <div className="bg-white px-5 py-4 text-sm font-semibold text-ink">{label}</div>
              <div className="px-5 py-4 text-sm text-muted">{left}</div>
              <div className="px-5 py-4 text-sm text-muted">{right}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="bg-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Pre-sales FAQ</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Questions buyers ask before they commit.</h2>
            <div className="mt-5 space-y-3">
              {preSalesFaqs.map((entry) => (
                <div key={entry} className="rounded-2xl border border-line bg-surface-soft/35 px-4 py-3 text-sm leading-6 text-muted">{entry}</div>
              ))}
            </div>
          </Card>

          <Card className="bg-[linear-gradient(145deg,rgba(19,109,76,0.98),rgba(16,95,67,0.96)_55%,rgba(29,125,87,0.94))] text-white shadow-[0_28px_64px_-34px_rgba(9,69,48,0.55)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Commercial clarity</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Know what unlocks before your team starts the trial.</h2>
            <p className="mt-3 text-sm leading-6 text-white/78">The trial is for workflow validation. The paid plan keeps the same workflow live for ongoing business use. There is no confusing upgrade path or hidden support split.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button href="/register?plan=zatca-monthly" size="lg" className="sm:flex-1 !bg-white !text-[#0f5f43] hover:!bg-[#f4fbf7]">Start Free Trial</Button>
              <a href={supportHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 sm:flex-1 sm:px-6 sm:py-3.5">WhatsApp Support</a>
            </div>
          </Card>
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