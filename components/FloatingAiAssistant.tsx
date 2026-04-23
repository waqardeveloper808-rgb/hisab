"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const LAUNCHER_WIDTH = 56;
const LAUNCHER_HEIGHT = 56;
const VIEWPORT_MARGIN = 20;

function clampPosition(x: number, y: number) {
  const maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - LAUNCHER_WIDTH - VIEWPORT_MARGIN);
  const maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - LAUNCHER_HEIGHT - VIEWPORT_MARGIN);

  return {
    x: Math.min(Math.max(VIEWPORT_MARGIN, x), maxX),
    y: Math.min(Math.max(VIEWPORT_MARGIN, y), maxY),
  };
}

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
  const [position, setPosition] = useState({ x: VIEWPORT_MARGIN, y: VIEWPORT_MARGIN });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const help = useMemo(() => resolveHelpTarget(pathname), [pathname]);

  useEffect(() => {
    setPosition(clampPosition(window.innerWidth - LAUNCHER_WIDTH - 28, window.innerHeight - LAUNCHER_HEIGHT - 28));
  }, []);

  useEffect(() => {
    function handleResize() {
      setPosition((current) => clampPosition(current.x, current.y));
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  function startDrag(event: React.PointerEvent<HTMLElement>) {
    dragOffsetRef.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };

    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    function handlePointerMove(moveEvent: PointerEvent) {
      setPosition(clampPosition(moveEvent.clientX - dragOffsetRef.current.x, moveEvent.clientY - dragOffsetRef.current.y));
    }

    function handlePointerUp(pointerEvent: PointerEvent) {
      target.releasePointerCapture(pointerEvent.pointerId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <div
      ref={rootRef}
      className="fixed z-50"
      style={{ left: position.x, top: position.y }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      {open ? (
        <div className="mb-3 w-[20rem] rounded-2xl border border-primary-border bg-white/96 p-3 shadow-[0_24px_54px_-28px_rgba(17,32,24,0.3)] backdrop-blur-xl" tabIndex={-1}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">AI Support</p>
              <p className="mt-1 text-sm font-semibold text-ink">{help.title}</p>
            </div>
            <button type="button" onPointerDown={startDrag} className="rounded-full border border-line bg-surface-soft px-2 py-1 text-[10px] font-semibold text-muted">Move</button>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">{help.body}</p>
          <div className="mt-4 flex gap-2">
            <Link href={help.href} className="inline-flex items-center justify-center rounded-full border border-primary bg-primary px-3 py-2 text-sm font-semibold text-white">Open Chat</Link>
            <button type="button" onClick={() => setOpen(false)} className="inline-flex items-center justify-center rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold text-ink">Close</button>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex size-14 items-center justify-center rounded-full border border-primary-border bg-white text-sm font-semibold text-ink shadow-[0_20px_42px_-24px_rgba(17,32,24,0.22)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary-soft"
        aria-label="Chat"
      >
        <span onPointerDown={startDrag} className="absolute -top-1 -left-1 inline-flex cursor-grab items-center rounded-full border border-line bg-surface-soft px-1.5 py-0.5 text-[10px] font-bold text-muted">::</span>
        <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">AI</span>
      </button>
    </div>
  );
}