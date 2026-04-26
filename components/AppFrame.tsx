"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { FloatingAiAssistant } from "@/components/FloatingAiAssistant";
import { Navbar } from "@/components/Navbar";
import { ReferralCapture } from "@/components/ReferralCapture";
import { WhatsAppSupportButton } from "@/components/WhatsAppSupportButton";

type AppFrameProps = {
  children: React.ReactNode;
  supportHref: string;
};

export function AppFrame({ children, supportHref }: AppFrameProps) {
  const pathname = usePathname();
  const isWorkspace = pathname.startsWith("/workspace");
  const isLanding = pathname === "/";
  const isTemplateStudio = pathname.includes("/document-templates") || pathname.includes("/settings/templates");
  const isDocumentPreviewRoute = [
    "/workspace/invoices",
    "/workspace/sales",
    "/workspace/bills",
    "/workspace/user/quotations",
    "/workspace/user/proforma-invoices",
    "/workspace/user/credit-notes",
    "/workspace/user/debit-notes",
    "/workspace/user/purchase-orders",
  ].some((prefix) => pathname.startsWith(prefix));
  const hideFloatingSupport = isTemplateStudio || isDocumentPreviewRoute;
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
        {!hideFloatingSupport ? <FloatingAiAssistant /> : null}
        {!hideFloatingSupport ? <WhatsAppSupportButton href={supportHref} /> : null}
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
      {!isLanding && !hideFloatingSupport ? <FloatingAiAssistant /> : null}
      {!isLanding && !hideFloatingSupport ? <WhatsAppSupportButton href={supportHref} /> : null}
    </div>
  );
}