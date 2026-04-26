"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircleMore } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { Input } from "@/components/Input";
import { SectionHeader } from "@/components/SectionHeader";

type PublicHelpCenterProps = {
  supportHref: string;
};

const faqGroups = [
  {
    title: "Pre-sales",
    items: [
      { title: "Pricing and trial", description: "Understand the free trial, the monthly plan, and what changes when the workspace moves into ongoing use." },
      { title: "ZATCA readiness", description: "See how company identity, VAT fields, and invoice output are positioned before a team commits." },
      { title: "Support access", description: "Know how WhatsApp support, guided help, and setup assistance work before sign-up." },
      { title: "Commercial fit", description: "Review whether the workflow is designed for invoicing-only use or full finance operations." },
    ],
  },
  {
    title: "Setup",
    items: [
      { title: "Company setup wizard", description: "Configure company name, country, VAT number, address, logo, stamp, and signature from one onboarding flow." },
      { title: "Skipping setup", description: "Users can enter the workspace first and return later, while the system keeps a warning banner visible until setup is completed." },
      { title: "Profile updates later", description: "Company settings stay editable from the workspace settings area after onboarding is done." },
    ],
  },
  {
    title: "Invoicing",
    items: [
      { title: "Invoice registers", description: "Review compact tables, open the preview panel, and use edit, download, print, and send from one register flow." },
      { title: "Document editor", description: "Use the full-screen editor with explicit save, cancel, preview, and exit actions." },
    ],
  },
  {
    title: "VAT / ZATCA",
    items: [
      { title: "VAT review", description: "Move from invoices into VAT review, journals, and reports without breaking transaction continuity." },
      { title: "Compliance continuity", description: "Track issue status, company identity, and exported output from the same workflow used to prepare the document." },
    ],
  },
  {
    title: "Accounting",
    items: [
      { title: "Journals and ledgers", description: "Review accounting impact, aging, and linked reporting without rebuilding the transaction in another screen." },
      { title: "Operational visibility", description: "Use dashboard cards, reports, and registers for fast daily review with less empty space." },
    ],
  },
  {
    title: "Inventory",
    items: [
      { title: "Products and stock", description: "Manage products, pricing, and item-level workflow details from the same platform used for invoicing." },
      { title: "Item readiness", description: "Keep products available for quotes, invoices, and reporting without switching systems." },
    ],
  },
  {
    title: "Support",
    items: [
      { title: "Help and support", description: "Search FAQs, open a support request, or jump to WhatsApp support when a workflow is blocked." },
      { title: "Support follow-up", description: "Capture onboarding blockers, billing questions, VAT requests, and product feedback from one public help surface." },
    ],
  },
];

const supportChannels = [
  { title: "FAQs", description: "Start with grouped answers before opening a request or switching channels." },
  { title: "Support requests", description: "Capture setup blockers, usage issues, or workflow gaps from one public help surface." },
  { title: "Feature requests", description: "Record missing workflow, reporting, or integration needs for follow-up." },
  { title: "WhatsApp support", description: "Send a direct message when the business needs a fast human answer." },
  { title: "System status", description: "Check whether the platform, workspace API, and support channels are operating normally." },
];

function includesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export function PublicHelpCenter({ supportHref }: PublicHelpCenterProps) {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [requestDraft, setRequestDraft] = useState({ title: "", details: "" });
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const button = document.getElementById("public-help-scroll-top");
      if (!button) {
        return;
      }

      if (window.scrollY > 480) {
        button.dataset.visible = "true";
      } else {
        button.dataset.visible = "false";
      }
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredGroups = useMemo(() => {
    if (! activeQuery) {
      return faqGroups;
    }

    return faqGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => includesQuery(`${group.title} ${item.title} ${item.description}`, activeQuery)),
      }))
      .filter((group) => group.items.length);
  }, [activeQuery]);

  const filteredSupportEntries = useMemo(() => {
    if (! activeQuery) {
      return supportChannels;
    }

    return supportChannels.filter((entry) => includesQuery(`${entry.title} ${entry.description}`, activeQuery));
  }, [activeQuery]);

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeader
          eyebrow="Help center"
          title="Help, support, requests, and status in one public support center."
          description="Search setup and operational guidance, review grouped FAQs, send a request, open WhatsApp support, and check system status before work stalls."
          align="center"
          titleAs="h1"
        />

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {["pricing", "setup wizard", "VAT", "invoices", "workspace", "support request"].map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => {
                setQuery(topic);
                setActiveQuery(topic);
              }}
              className="rounded-full border border-line bg-white px-3.5 py-2 text-sm font-medium text-muted shadow-[0_10px_20px_-18px_rgba(17,32,24,0.14)] hover:border-primary/25 hover:text-primary"
            >
              {topic}
            </button>
          ))}
        </div>

        <Card className="mx-auto mt-10 max-w-4xl border-primary/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,247,242,0.96))] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <h2 className="text-xl font-semibold text-ink">Find an answer quickly</h2>
              <p className="mt-1 text-sm text-muted">Search pre-sales, setup, usage, VAT, and support workflows.</p>
            </div>
            <span className="rounded-full border border-primary-border bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Public support
            </span>
          </div>
          <form
            className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              setActiveQuery(query.trim());
            }}
          >
            <Input
              label="Search the help center"
              type="search"
              placeholder="Try: ZATCA, onboarding, invoice preview, WhatsApp"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button className="md:min-w-32" size="lg" type="submit">Search</Button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2 text-sm text-muted">
            {[
              "company setup",
              "invoice preview",
              "WhatsApp support",
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setQuery(suggestion);
                  setActiveQuery(suggestion);
                }}
                className="rounded-full bg-white px-3 py-1.5 hover:text-primary"
              >
                Suggested: {suggestion}
              </button>
            ))}
          </div>
        </Card>

        <div className="mt-10">
          <SectionHeader
            eyebrow="FAQ structure"
            title="Start from the stage of the journey you are in."
            description="The help center is split into pre-sales, setup, invoicing, VAT/ZATCA, accounting, inventory, and support so users reach the right answer faster."
            titleAs="h2"
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredGroups.map((group) => (
              <Card key={group.title} className="bg-white">
                <p className="text-lg font-semibold text-ink">{group.title}</p>
                <div className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-line bg-surface-soft/35 px-4 py-3">
                      <p className="text-sm font-semibold text-ink">{item.title}</p>
                      <p className="mt-1.5 text-sm leading-6 text-muted">{item.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-5 md:grid-cols-2">
            {filteredSupportEntries.map((entry) => (
              <Card key={entry.title} className="h-full bg-white hover:-translate-y-1 hover:shadow-[0_24px_50px_-34px_rgba(17,32,24,0.16)]">
                <h2 className="text-xl font-semibold text-ink">{entry.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted">{entry.description}</p>
              </Card>
            ))}

            <Card className="bg-white md:col-span-2">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Support request</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Capture an onboarding, billing, VAT, or product request without leaving the page.</h2>
              <div className="mt-5 grid gap-4">
                <Input label="Request title" value={requestDraft.title} onChange={(event) => setRequestDraft((current) => ({ ...current, title: event.target.value }))} />
                <label className="grid gap-2 text-sm font-semibold text-ink">
                  <span>Details</span>
                  <textarea value={requestDraft.details} onChange={(event) => setRequestDraft((current) => ({ ...current, details: event.target.value }))} rows={5} className="block w-full rounded-[var(--radius-sm)] border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand/45 focus:ring-2 focus:ring-brand/10" placeholder="Explain the onboarding blocker, invoicing issue, VAT question, or product request." />
                </label>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setRequestSubmitted(true)}>Submit request</Button>
                  {requestSubmitted ? <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Request recorded locally for follow-up.</span> : null}
                </div>
              </div>
            </Card>
          </div>

          <Card className="h-fit bg-white">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Support and status
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
              Reach the right support path with less back and forth.
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Start with guided help here, use WhatsApp when you need a fast human answer, and check system status before assuming the issue is inside your workflow.
            </p>
            <div className="mt-6 space-y-3">
              {["Platform status: operational", "Workspace API: connected", "Support channel: WhatsApp available"].map((entry) => (
                <div key={entry} className="rounded-2xl border border-line bg-surface-soft px-4 py-4">
                  <p className="text-sm font-semibold text-ink">{entry}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={supportHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_-18px_rgba(63,174,42,0.38)] hover:-translate-y-0.5 hover:bg-primary-hover sm:px-6 sm:py-3.5">
                <MessageCircleMore className="h-4 w-4" />
                Open WhatsApp support
              </a>
              <Button href="/workspace/help/ai" size="lg">Open workspace AI help</Button>
              <Button href="/workspace/help/faq" variant="secondary" size="lg">Browse workspace FAQ</Button>
            </div>
          </Card>
        </div>

        <button
          id="public-help-scroll-top"
          type="button"
          data-visible="false"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 z-40 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft opacity-0 transition data-[visible=true]:opacity-100"
        >
          Top
        </button>

        <a
          href={supportHref}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 left-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-white text-primary shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40"
          aria-label="Open WhatsApp support"
        >
          <MessageCircleMore className="h-5 w-5" />
        </a>
      </Container>
    </section>
  );
}