import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { helpArticles } from "@/data/help-center";

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-white/70 bg-white/95 p-6 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Help</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Get answers without disrupting the work in front of you.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">Start with structured help categories, search the FAQ when you need a fast answer, and move to AI or support only when the workflow still needs help.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/workspace/help/ai">Open AI help</Button>
          <Button href="/workspace/help/faq" variant="secondary">Browse FAQ</Button>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Link href="/workspace/help/faq">
          <Card className="rounded-xl bg-white/95 p-6 hover:border-primary/25">
            <p className="text-sm font-semibold text-primary">FAQ</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Browse common answers</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Start with invoices, bills, VAT review, books, reports, contacts, and settings guidance.</p>
          </Card>
        </Link>
        <Link href="/workspace/help/ai">
          <Card className="rounded-xl bg-white/95 p-6 hover:border-primary/25">
            <p className="text-sm font-semibold text-primary">AI help</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Ask for guided help</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Use a focused entry point for workflow questions without leaving the workspace.</p>
          </Card>
        </Link>
        <Link href="/help">
          <Card className="rounded-xl bg-white/95 p-6 hover:border-primary/25">
            <p className="text-sm font-semibold text-primary">Public help</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Open the help center</h2>
            <p className="mt-3 text-sm leading-6 text-muted">View setup, invoicing, VAT, accounting, inventory, and support guidance from the public support surface.</p>
          </Card>
        </Link>
      </div>

      <Card className="rounded-xl bg-white/95 p-6">
        <div className="flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Articles</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Step-by-step operating guides</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted">Use short guides for first invoice setup, first purchase capture, and VAT or BI review without interrupting the live workflow.</p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {helpArticles.map((article) => (
            <Link key={article.slug} href={`/workspace/help/articles/${article.slug}`}>
              <Card className="h-full rounded-xl border border-line bg-surface-soft p-5 hover:border-primary/25 hover:bg-white">
                <p className="text-sm font-semibold text-primary">{article.category}</p>
                <h3 className="mt-2 text-xl font-semibold text-ink">{article.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{article.summary}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}