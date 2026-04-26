import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { appName } from "@/lib/brand";
import { authSessionCookieName, readAuthSession } from "@/lib/auth-session";

export const metadata = {
  title: "Log in",
};

export default async function LoginPage() {
  const cookieStore = await cookies();
  const session = await readAuthSession(cookieStore.get(authSessionCookieName)?.value);

  if (session) {
    redirect(session.workspaceContext?.activeCompany?.id ? "/workspace/user" : "/onboarding/company");
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title={`Log in to ${appName}`}
      description="Sign in to continue with your ZATCA-compliant invoicing workspace, reports, and support tools."
      checklist={[
        "Pick up where you left off",
        "Review invoices and VAT reports",
        "Access your invoicing workspace securely",
      ]}
    >
      <LoginForm />
    </AuthShell>
  );
}