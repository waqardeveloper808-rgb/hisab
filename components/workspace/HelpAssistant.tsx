"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useWorkspacePath } from "@/components/workspace/WorkspacePathProvider";
import { mapWorkspaceHref } from "@/lib/workspace-path";

const knowledgeBase = [
  {
    title: "Invoice follow-up",
    keywords: ["invoice", "customer", "receivable", "payment", "overdue"],
    guidance: "Create or open the invoice from Sales, then use Banking to record money received and Reports to review receivables aging.",
    nextStep: "/workspace/invoices/new",
    nextLabel: "Open invoice flow",
  },
  {
    title: "Vendor bill and supplier payment",
    keywords: ["bill", "supplier", "purchase", "payable"],
    guidance: "Enter the vendor bill from Purchases, then record the payment from Banking so balances and books update together.",
    nextStep: "/workspace/bills/new",
    nextLabel: "Open vendor bill flow",
  },
  {
    title: "VAT review",
    keywords: ["vat", "tax", "filing", "compliance"],
    guidance: "Open Reports for VAT summary and VAT detail, then use the VAT module for review before filing.",
    nextStep: "/workspace/reports",
    nextLabel: "Open reports",
  },
  {
    title: "Books and statements",
    keywords: ["ledger", "trial balance", "balance sheet", "profit", "audit"],
    guidance: "Use Books for ledger review and Reports for trial balance, profit and loss, balance sheet, and audit trail review.",
    nextStep: "/workspace/accounting/books",
    nextLabel: "Open books",
  },
];

export function HelpAssistant() {
  const { basePath } = useWorkspacePath();
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const matches = useMemo(() => {
    const normalizedQuery = activeQuery.trim().toLowerCase();

    if (! normalizedQuery) {
      return knowledgeBase;
    }

    return knowledgeBase.filter((entry) => entry.keywords.some((keyword) => normalizedQuery.includes(keyword)));
  }, [activeQuery]);

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/70 bg-white/92 p-7 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">AI help</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Ask for guided help from inside the workspace.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">Start with a question and get the nearest workflow, report, or module that should own the next step.</p>
      </Card>

      <Card className="rounded-[1.8rem] bg-white/92 p-6">
        <form
          className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            setActiveQuery(query);
          }}
        >
          <Input label="Ask a question" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try: review VAT before filing, track an unpaid invoice, or check supplier payments" />
          <Button size="lg" type="submit">Ask AI help</Button>
        </form>
        <div className="mt-5 flex flex-wrap gap-2 text-sm text-muted">
          {[
            "Invoice follow-up",
            "Vendor bill entry",
            "VAT review",
            "Balance sheet",
          ].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setQuery(suggestion);
                setActiveQuery(suggestion);
              }}
              className="rounded-full bg-surface-soft px-3 py-2 hover:text-primary"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {matches.length ? matches.map((match) => (
          <Card key={match.title} className="rounded-[1.8rem] bg-white/92 p-6">
            <p className="text-sm font-semibold text-primary">{match.title}</p>
            <p className="mt-3 text-sm leading-6 text-muted">{match.guidance}</p>
            <div className="mt-5">
              <Button href={mapWorkspaceHref(match.nextStep, basePath)} variant="secondary">{match.nextLabel}</Button>
            </div>
          </Card>
        )) : (
          <Card className="rounded-[1.8rem] bg-white/92 p-6 lg:col-span-2">
            <p className="text-lg font-semibold text-ink">No close match yet</p>
            <p className="mt-3 text-sm leading-6 text-muted">Try a simpler business phrase such as invoice, vendor bill, VAT, payment, report, or ledger.</p>
          </Card>
        )}
      </div>
    </div>
  );
}