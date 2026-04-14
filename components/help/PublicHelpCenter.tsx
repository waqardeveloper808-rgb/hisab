"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { Input } from "@/components/Input";
import { SectionHeader } from "@/components/SectionHeader";
import { helpCategories, helpFaqs, helpTopics, supportEntries } from "@/data/product";

type PublicHelpCenterProps = {
  supportHref: string;
};

function includesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export function PublicHelpCenter({ supportHref }: PublicHelpCenterProps) {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    if (! activeQuery) {
      return helpFaqs;
    }

    return helpFaqs.filter((faq) => includesQuery(`${faq.category} ${faq.title} ${faq.description}`, activeQuery));
  }, [activeQuery]);

  const filteredCategories = useMemo(() => {
    if (! activeQuery) {
      return helpCategories;
    }

    return helpCategories.filter((category) => includesQuery(`${category.title} ${category.description}`, activeQuery));
  }, [activeQuery]);

  const filteredSupportEntries = useMemo(() => {
    if (! activeQuery) {
      return supportEntries;
    }

    return supportEntries.filter((entry) => includesQuery(`${entry.title} ${entry.description}`, activeQuery));
  }, [activeQuery]);

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeader
          eyebrow="Help center"
          title="Get help with ZATCA-compliant invoicing before work stalls."
          description="Use the public help center for setup, pricing, WhatsApp support, and product guidance, then move into the workspace for task-level help when you are signed in."
          align="center"
          titleAs="h1"
        />

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {helpTopics.map((topic) => (
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
            eyebrow="Support categories"
            title="Start from the part of the product you need help with."
            description="Browse public guidance first, then continue into the authenticated workspace when the question is tied to a live invoice or report."
            titleAs="h2"
          />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {filteredCategories.map((category) => (
              <Card key={category.title} className="bg-white">
                <p className="text-lg font-semibold text-ink">{category.title}</p>
                <p className="mt-3 text-sm leading-6 text-muted">{category.description}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-5 md:grid-cols-2">
            {filteredFaqs.map((faq) => (
              <Card
                key={faq.title}
                className="h-full bg-white hover:-translate-y-1 hover:shadow-[0_24px_50px_-34px_rgba(17,32,24,0.16)]"
              >
                <span className="rounded-full border border-primary-border bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  {faq.category}
                </span>
                <h2 className="mt-4 text-xl font-semibold text-ink">{faq.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted">{faq.description}</p>
                <p className="mt-5 text-sm font-medium text-primary">Useful for: {faq.category.toLowerCase()}</p>
              </Card>
            ))}
          </div>

          <Card className="h-fit bg-white">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Support entry points
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
              Reach the right channel with less back and forth.
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Start with guided help here, use WhatsApp when you need a fast human answer, then move into workspace FAQ and AI help when the question is tied to live invoicing work.
            </p>
            <div className="mt-6 space-y-3">
              {filteredSupportEntries.map((entry) => (
                <div key={entry.title} className="rounded-2xl border border-line bg-surface-soft px-4 py-4">
                  <p className="text-sm font-semibold text-ink">{entry.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{entry.description}</p>
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
      </Container>
    </section>
  );
}