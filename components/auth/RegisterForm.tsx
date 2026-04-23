"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { referralCaptureCookieNames } from "@/components/ReferralCapture";

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [planCode, setPlanCode] = useState("zatca-monthly");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const passwordsMatch = password && password === confirmPassword;

  useEffect(() => {
    const nextReferralCode = searchParams.get("ref") || readCookie(referralCaptureCookieNames.referral);
    const nextPlanCode = searchParams.get("plan") || readCookie(referralCaptureCookieNames.plan) || "zatca-monthly";

    if (nextReferralCode) {
      setReferralCode(nextReferralCode);
    }

    setPlanCode(nextPlanCode);
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!passwordsMatch) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          password_confirmation: confirmPassword,
          referral_code: referralCode || undefined,
          plan_code: planCode,
        }),
      });

      if (! response.ok) {
        const payload = await response.json().catch(() => null) as { message?: string; errors?: Record<string, string[]> } | null;
        const fieldError = payload?.errors
          ? Object.values(payload.errors)[0]?.[0]
          : null;

        setErrorMessage(fieldError ?? payload?.message ?? "Your account could not be created.");
        return;
      }

      clearCookie(referralCaptureCookieNames.referral);
      router.push("/workspace/user");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input label="Full name" name="fullName" placeholder="Your full name" required value={fullName} onChange={(event) => setFullName(event.target.value)} />
        <Input label="Email" type="email" name="email" placeholder="name@company.sa" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input label="Password" type="password" name="password" placeholder="Create a password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        {referralCode ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Agent referral applied: <span className="font-semibold">{referralCode}</span>
          </div>
        ) : null}
        <Input
          label="Confirm password"
          type="password"
          name="confirmPassword"
          placeholder="Confirm your password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          hint={confirmPassword && !passwordsMatch ? "Passwords need to match before you continue." : undefined}
        />

        <Button type="submit" size="lg" fullWidth disabled={saving || !fullName || !email || !passwordsMatch}>
          {saving ? "Preparing workspace" : "Create workspace"}
        </Button>

        <p className="text-center text-sm text-muted">This workspace opens in build mode so you can configure invoicing, VAT, and reporting without upgrade prompts.</p>

        {errorMessage ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
          Log in
        </Link>
      </p>
    </>
  );
}