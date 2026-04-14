"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function resolveHelpTarget(pathname: string) {
  const basePath = pathname.startsWith("/workspace") ? "/workspace" : "/helpdesk-ai";

  if (pathname.includes("dashboard")) {
    return {
      title: "Dashboard Help",
      body: "Read sales, income, expenses, VAT payable, and top customers together before choosing the next workflow.",
      href: basePath === "/helpdesk-ai" ? "/helpdesk-ai" : `${basePath}/help/ai`,
    };
  }

  if (pathname.includes("invoice") || pathname.includes("sales")) {
    return {
      title: "Invoice Help",
      body: "Use the live invoice editor to create, finalize, preview, and settle invoices without leaving the workspace flow.",
      href: basePath === "/helpdesk-ai" ? "/helpdesk-ai" : `${basePath}/help/ai`,
    };
  }

  if (pathname.includes("vat")) {
    return {
      title: "VAT Help",
      body: "Use VAT detail and summary to review output and input tax before filing or discussing exceptions.",
      href: basePath === "/helpdesk-ai" ? "/helpdesk-ai" : `${basePath}/help/ai`,
    };
  }

  if (pathname.includes("report") || pathname.includes("accounting")) {
    return {
      title: "Reports Help",
      body: "Use reports for statutory review and books for ledger validation, trial balance, and audit trail checks.",
      href: basePath === "/helpdesk-ai" ? "/helpdesk-ai" : `${basePath}/help/ai`,
    };
  }

  return {
    title: "AI Assistant",
    body: "Open guided help for invoices, VAT, dashboard review, and reports from any page.",
    href: basePath === "/helpdesk-ai" ? "/helpdesk-ai" : `${basePath}/help/ai`,
  };
}

export function FloatingAiAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const help = useMemo(() => resolveHelpTarget(pathname), [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="fixed bottom-5 left-5 z-50 sm:bottom-6 sm:left-6"
      onMouseLeave={() => setOpen(false)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      {open ? (
        <div className="mb-3 w-[20rem] rounded-[1.6rem] border border-primary-border bg-white/96 p-4 shadow-[0_24px_54px_-28px_rgba(17,32,24,0.3)] backdrop-blur-xl" tabIndex={-1}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{help.title}</p>
          <p className="mt-3 text-sm leading-6 text-muted">{help.body}</p>
          <div className="mt-4 flex gap-3">
            <Link href={help.href} className="inline-flex items-center justify-center rounded-2xl border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white">Open Help</Link>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-3 rounded-full border border-primary-border bg-white px-4 py-3 text-sm font-semibold text-ink shadow-[0_20px_42px_-24px_rgba(17,32,24,0.22)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary-soft"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">AI</span>
        <span>{help.title}</span>
      </button>
    </div>
  );
}