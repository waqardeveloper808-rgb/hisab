"use client";

import { useEffect, useMemo, useState } from "react";
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
      { title: "Pricing", description: "Understand the trial, the monthly plan, and what changes after conversion." },
      { title: "Trial", description: "See what users can validate during the live trial workflow." },
      { title: "Support", description: "Know how WhatsApp support and guided help work before sign-up." },
      { title: "Limits", description: "Review commercial boundaries without guessing which features are included." },
    ],
  },
  {
    title: "Onboarding",
    items: [
      { title: "Company setup", description: "Configure legal entity, VAT, address, and document defaults from one profile." },
      { title: "VAT setup", description: "Keep VAT behavior visible before the first live invoice is issued." },
      { title: "Import", description: "Map contacts and items before importing them into the working system." },
    ],
  },
  {
    title: "Operational",
    items: [
      { title: "Invoices", description: "Create, send, and track invoices from the operational workflow." },
      { title: "Credit notes", description: "Reverse or adjust issued documents without breaking continuity." },
      { title: "Debit notes", description: "Apply additional charges with a clean audit path." },
      { title: "Reports", description: "Move from transactions into journals, VAT, and reporting output." },
      { title: "Lock periods", description: "Protect closed periods and prevent untracked changes after review." },
    ],
  },
];

const supportChannels = [
  { title: "FAQs", description: "Start with grouped answers before opening a ticket or sending a message." },
  { title: "Feature requests", description: "Capture missing workflow or reporting requests in one place." },
  { title: "Submit request", description: "Log a support or onboarding request when the answer is not in the public help articles." },
  { title: "WhatsApp support", description: "Send a direct message when the business needs a human answer quickly." },
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
          {["pricing", "trial", "support", "VAT setup", "invoices", "reports"].map((topic) => (
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
              <p className="mt-1 text-sm text-muted">Search onboarding guidance, VAT questions, and common invoicing workflows.</p>
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
              placeholder="Try: ZATCA, VAT, WhatsApp, free trial"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button className="md:min-w-32" size="lg" type="submit">Search</Button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2 text-sm text-muted">
            {[
              "first invoice",
              "VAT review",
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
            title="Start from the stage of the decision or workflow you are in."
            description="The public help center is split into pre-sales, onboarding, and operational questions so users reach the right answer faster."
            titleAs="h2"
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
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
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Submit request</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Capture a feature request or support request without leaving the page.</h2>
              <div className="mt-5 grid gap-4">
                <Input label="Request title" value={requestDraft.title} onChange={(event) => setRequestDraft((current) => ({ ...current, title: event.target.value }))} />
                <label className="grid gap-2 text-sm font-semibold text-ink">
                  <span>Details</span>
                  <textarea value={requestDraft.details} onChange={(event) => setRequestDraft((current) => ({ ...current, details: event.target.value }))} rows={5} className="block w-full rounded-[var(--radius-sm)] border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand/45 focus:ring-2 focus:ring-brand/10" placeholder="Explain the workflow gap, question, or request." />
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
              <a href={supportHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-2xl border border-primary bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_-18px_rgba(31,122,83,0.6)] hover:-translate-y-0.5 hover:bg-primary-hover sm:px-6 sm:py-3.5">
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
      </Container>
    </section>
  );
}