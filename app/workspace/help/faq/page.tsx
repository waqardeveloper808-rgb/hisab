"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { faqGroups } from "@/data/help-center";

export default function HelpFaqPage() {
  const [query, setQuery] = useState("");
  const filteredGroups = useMemo(
    () => faqGroups
      .map((group) => ({
        ...group,
        questions: group.questions.filter((item) => `${group.category} ${item.question} ${item.answer}`.toLowerCase().includes(query.toLowerCase())),
      }))
      .filter((group) => group.questions.length > 0),
    [query],
  );

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">FAQ</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Common answers organised by work area.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">This keeps daily help easy to scan without turning the workspace into a support screen.</p>
        <div className="mt-6 max-w-md">
          <Input label="Search FAQ" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search invoices, VAT, supplier payments, books, or reports" />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {filteredGroups.map((group) => (
          <Card key={group.category} className="rounded-[1.8rem] bg-white/92 p-6">
            <p className="text-sm font-semibold text-primary">{group.category}</p>
            <div className="mt-4 space-y-3">
              {group.questions.map((item) => (
                <div key={item.question} className="rounded-[1.3rem] border border-line bg-surface-soft p-4 text-sm leading-6 text-muted">
                  <p className="font-semibold text-ink">{item.question}</p>
                  <p className="mt-2">{item.answer}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {!filteredGroups.length ? (
        <Card className="rounded-[1.8rem] bg-white/92 p-6 text-sm text-muted">
          No FAQ entries match that search yet. Try broader finance terms such as invoice, VAT, payment, or books.
        </Card>
      ) : null}
    </div>
  );
}