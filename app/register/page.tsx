import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { appName } from "@/lib/brand";
import { authSessionCookieName, readAuthSession } from "@/lib/auth-session";
import { getProductConfig } from "@/lib/product-config";

export const metadata = {
  title: "Create account",
};

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const session = await readAuthSession(cookieStore.get(authSessionCookieName)?.value);
  const config = await getProductConfig();

  if (session) {
    redirect(session.workspaceContext?.activeCompany?.id ? "/workspace/user" : "/onboarding/company");
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title={`Start your ${appName} trial`}
      description={`Create your account, get full access for ${config.freeTrialDays} days, and keep one invoice per month free after the trial if you want to stay light.`}
      checklist={[
        `${config.freeTrialDays}-day free trial`,
        `${config.freeInvoiceLimit} invoice per month free`,
        `Paid plan from SAR ${config.paidPlanMonthlyPriceSar}`,
      ]}
    >
      <RegisterForm />
    </AuthShell>
  );
}