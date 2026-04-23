"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function applyDummyLogin() {
    setEmail("demo@gulfhisab.local");
    setPassword("demo123");
    setErrorMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSaving(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (! response.ok) {
        const payload = await response.json().catch(() => null) as { message?: string; errors?: Record<string, string[]> } | null;
        const nextError = payload?.errors?.email?.[0] ?? payload?.message ?? "Your sign-in could not be completed.";
        setErrorMessage(nextError);
        return;
      }

      router.push("/workspace/user");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input label="Email" type="email" name="email" placeholder="name@company.sa" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input label="Password" type="password" name="password" placeholder="Enter your password" required value={password} onChange={(event) => setPassword(event.target.value)} />

        <button
          type="button"
          className="text-sm font-semibold text-brand hover:text-brand-dark"
          onClick={applyDummyLogin}
        >
          Use dummy login
        </button>

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" className="size-4 rounded border-line-strong text-brand focus:ring-brand/20" />
            <span>Remember me</span>
          </label>
          <Link href="/helpdesk-ai" className="font-semibold text-brand hover:text-brand-dark">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" fullWidth disabled={saving || !email || !password}>
          {saving ? "Opening workspace" : "Log in"}
        </Button>

        {errorMessage ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Need an account?{" "}
        <Link href="/register" className="font-semibold text-brand hover:text-brand-dark">
          Create account
        </Link>
      </p>
    </>
  );
}