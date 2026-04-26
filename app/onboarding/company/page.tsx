import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { CompanySetupWizard } from "@/components/auth/CompanySetupWizard";
import { authSessionCookieName, readAuthSession } from "@/lib/auth-session";

export const metadata = {
  title: "Company setup",
};

export default async function CompanyOnboardingPage() {
  const cookieStore = await cookies();
  const session = await readAuthSession(cookieStore.get(authSessionCookieName)?.value);

  if (!session) {
    redirect("/login");
  }

  return (
    <AuthShell
      eyebrow="Company onboarding"
      title="Prepare your company workspace"
      description="Complete the company profile once so invoices, previews, and support flows start with the correct legal identity and ZATCA-facing details."
      checklist={[
        "Create the active company profile",
        "Upload logo, stamp, and signature",
        "Enter the workspace with a ready settings baseline",
      ]}
      contentClassName="max-w-[78rem]"
      panelClassName="max-w-none p-0 shadow-none border-0 bg-transparent"
    >
      <CompanySetupWizard
        hasActiveCompany={Boolean(session.workspaceContext?.activeCompany?.id)}
        userName={session.name}
      />
    </AuthShell>
  );
}
