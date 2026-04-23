import { redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { canAccessWorkspaceArea } from "@/lib/access-control";
import { getWorkspaceSessionAccess } from "@/lib/server-access";

export default async function SupportPage() {
  const { session, access } = await getWorkspaceSessionAccess();

  if (!canAccessWorkspaceArea(access, { platform: ["platform.customers.view", "platform.support_users.manage"] })) {
    redirect("/workspace/dashboard");
  }

  const cards = [
    { title: "Customer companies", description: "Open company records, subscription state, and linked users for support work.", href: "/workspace/admin/customers", enabled: canAccessWorkspaceArea(access, { platform: ["platform.customers.view"] }) },
    { title: "Support accounts", description: "Review which internal operators have access to the platform.", href: "/workspace/admin/support-accounts", enabled: canAccessWorkspaceArea(access, { platform: ["platform.support_users.manage"] }) },
    { title: "Company users", description: "Jump into the live company-side user management area when helping a customer.", href: "/workspace/settings/users", enabled: canAccessWorkspaceArea(access, { company: ["company.users.manage"] }) },
  ].filter((item) => item.enabled);

  return (
    <Container className="py-10">
      <div className="space-y-6">
        <Card className="rounded-xl border-white/70 bg-white/95 p-6 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <BrandMark href="/support" />
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-primary">Support panel</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Support operators get a cleaner surface for customer recovery and access work.</h1>
              <p className="mt-4 text-base leading-7 text-muted">Signed in as {session.name}. This panel keeps support actions explicit while the workspace remains accessible for live testing.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/workspace/dashboard" variant="secondary">Open workspace</Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.href} className="rounded-xl bg-white/95 p-5">
              <h2 className="text-2xl font-semibold text-ink">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{card.description}</p>
              <div className="mt-5">
                <Button href={card.href} fullWidth>{card.title}</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Container>
  );
}