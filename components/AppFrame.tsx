"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ReferralCapture } from "@/components/ReferralCapture";

type AppFrameProps = {
  children: React.ReactNode;
  supportHref: string;
};

export function AppFrame({ children, supportHref }: AppFrameProps) {
  const pathname = usePathname();
  const isWorkspace = pathname.startsWith("/workspace");
  const isLanding = pathname === "/";
  const referralCapture = (
    <Suspense fallback={null}>
      <ReferralCapture />
    </Suspense>
  );

  if (isWorkspace) {
    return (
      <div className="relative flex min-h-full flex-col overflow-x-hidden">
        {referralCapture}
        {children}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden">
      {referralCapture}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_top,_rgba(63,174,42,0.14),_transparent_58%)]" />
      <div className="pointer-events-none absolute left-0 top-32 h-80 w-80 rounded-full bg-[rgba(91,198,63,0.14)] blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-[24rem] h-96 w-96 rounded-full bg-[rgba(245,245,245,0.92)] blur-3xl" />
      <Navbar />
      <div className="h-[var(--navbar-height)] shrink-0" aria-hidden="true" />
      <main className={["relative flex-1", isLanding ? "overflow-hidden" : ""].join(" ")}>{children}</main>
      <Footer supportHref={supportHref} />
    </div>
  );
}
