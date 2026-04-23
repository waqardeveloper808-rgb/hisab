import { redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { canAccessWorkspaceArea } from "@/lib/access-control";
import { getWorkspaceSessionAccess } from "@/lib/server-access";

export default async function AdminPage() {
  const { session, access } = await getWorkspaceSessionAccess();

  if (!canAccessWorkspaceArea(access, { platform: ["platform.plans.view", "platform.agents.view", "platform.customers.view", "platform.support_users.manage"] })) {
    redirect("/workspace/dashboard");
  }

  const cards = [
    { title: "Plans", description: "Control trial rules, plan limits, and pricing content.", href: "/workspace/admin/plans", enabled: canAccessWorkspaceArea(access, { platform: ["platform.plans.view"] }) },
    { title: "Customers", description: "Inspect subscribed companies, owners, and linked users.", href: "/workspace/admin/customers", enabled: canAccessWorkspaceArea(access, { platform: ["platform.customers.view"] }) },
    { title: "Agents", description: "Manage referral agents and their commercial performance.", href: "/workspace/admin/agents", enabled: canAccessWorkspaceArea(access, { platform: ["platform.agents.view"] }) },
    { title: "Support accounts", description: "Control internal platform accounts and permissions.", href: "/workspace/admin/support-accounts", enabled: canAccessWorkspaceArea(access, { platform: ["platform.support_users.manage"] }) },
  ].filter((item) => item.enabled);

  return (
    <Container className="py-10">
      <div className="space-y-6">
        <Card className="rounded-xl border-white/70 bg-white/95 p-6 shadow-[0_28px_54px_-38px_rgba(17,32,24,0.2)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <BrandMark href="/admin" />
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-primary">Admin panel</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Platform administration stays separate from the accounting workspace.</h1>
              <p className="mt-4 text-base leading-7 text-muted">Signed in as {session.name}. Use this panel to manage platform entities without hiding the shared workspace during testing.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/workspace/dashboard" variant="secondary">Open workspace</Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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