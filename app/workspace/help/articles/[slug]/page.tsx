import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";
import { helpArticles } from "@/data/help-center";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return helpArticles.map((article) => ({ slug: article.slug }));
}

export default async function HelpArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = helpArticles.find((entry) => entry.slug === slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-white/70 bg-white/95 p-6 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{article.category}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">{article.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">{article.summary}</p>
        <div className="mt-6">
          <Link href="/workspace/help" className="text-sm font-semibold text-primary hover:text-primary-hover">Back to help center</Link>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-5">
          {article.sections.map((section) => (
            <Card key={section.heading} className="rounded-xl bg-white/95 p-6">
              <h2 className="text-2xl font-semibold text-ink">{section.heading}</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className="rounded-xl bg-white/95 p-6 lg:sticky lg:top-28 lg:h-fit">
          <p className="text-sm font-semibold text-primary">Related guides</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
            {helpArticles.filter((entry) => entry.slug !== article.slug).map((entry) => (
              <Link key={entry.slug} href={`/workspace/help/articles/${entry.slug}`} className="block rounded-lg border border-line bg-surface-soft px-4 py-3 hover:border-primary/25 hover:bg-white">
                <p className="font-semibold text-ink">{entry.title}</p>
                <p className="mt-1">{entry.summary}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}