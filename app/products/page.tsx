import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { ModuleCard } from "@/components/ModuleCard";
import { SectionHeader } from "@/components/SectionHeader";
import { productModules, reportsModule } from "@/data/product";
import { appName } from "@/lib/brand";
import { getProductConfig } from "@/lib/product-config";

const connectionFlow = [
  {
    title: "Start with invoices",
    description: "Customer billing starts in one guided screen so the business can create and send faster.",
  },
  {
    title: "Let VAT stay automatic",
    description: "The same invoice flow keeps VAT visible without manual calculations or spreadsheet work.",
  },
  {
    title: "Review and stay compliant",
    description: "Use reports, settings, and support to keep invoicing clear and ZATCA ready.",
  },
];

export const metadata = {
  title: "Products",
};

export default async function ProductsPage() {
  const config = await getProductConfig();
  const modules = [...productModules, reportsModule];

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeader
          eyebrow="Products"
          title="The product stack now reads like one connected invoicing system."
          description="Every module description has been tightened around invoicing, VAT, compliance, support, and reporting without placeholder badges or extra product noise."
          titleAs="h1"
        />

        <div className="mt-8 grid gap-5 rounded-xl border border-line bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(246,250,246,0.96))] p-6 shadow-[0_22px_44px_-36px_rgba(17,32,24,0.14)] lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
              Product clarity
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              One product promise: create invoice, send it, and stay compliant.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              The public story stays simple so a business owner knows what {appName} does within a few seconds and sees the same structure on the homepage and the standalone product page.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-white px-4 py-4">
              <p className="text-sm font-semibold text-ink">Built for Saudi invoicing</p>
              <p className="mt-2 text-sm leading-6 text-muted">The flow stays focused on ZATCA readiness instead of generic software jargon.</p>
            </div>
            <div className="rounded-lg border border-line bg-white px-4 py-4">
              <p className="text-sm font-semibold text-ink">Support stays close</p>
              <p className="mt-2 text-sm leading-6 text-muted">WhatsApp support and workspace help reduce the time between question and answer.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {modules.map((module, index) => (
            <ModuleCard
              key={module.title}
              title={module.title}
              summary={module.shortDescription}
              benefit={module.benefit}
              features={module.features}
              emphasis={index === modules.length - 1 ? "strong" : "default"}
            />
          ))}
        </div>

        <div className="mt-10">
          <SectionHeader
            eyebrow="How modules connect"
            title="Each part of the product supports the next decision."
            description="The product is designed so users can move from invoice entry into VAT review and reports without losing context."
            titleAs="h2"
          />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {connectionFlow.map((item) => (
              <Card key={item.title} className="bg-white">
                <h3 className="text-xl font-semibold text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 rounded-[1.85rem] border border-line bg-white px-6 py-6 shadow-[0_18px_38px_-30px_rgba(17,32,24,0.12)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">See the pricing path from free trial to monthly plan.</h2>
            <p className="mt-2 text-sm text-muted">Start with the {config.freeTrialDays}-day trial, then decide if the {config.paidPlanMonthlyPriceSar} SAR monthly plan fits the business.</p>
          </div>
          <Button href="/plans" size="lg">View pricing</Button>
        </div>
      </Container>
    </section>
  );
}