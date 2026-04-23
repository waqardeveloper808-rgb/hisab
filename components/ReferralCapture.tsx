"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const referralCookieName = "gulf_hisab_referral";
const planCookieName = "gulf_hisab_plan";
const cookieAge = 60 * 60 * 24 * 30;

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${cookieAge}; samesite=lax`;
}

export function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const referralCode = searchParams.get("ref");
    const planCode = searchParams.get("plan");

    if (referralCode) {
      setCookie(referralCookieName, referralCode);
    }

    if (planCode) {
      setCookie(planCookieName, planCode);
    }
  }, [searchParams]);

  return null;
}

export const referralCaptureCookieNames = {
  referral: referralCookieName,
  plan: planCookieName,
};