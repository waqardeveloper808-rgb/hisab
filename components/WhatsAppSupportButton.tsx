"use client";

import { useCallback, useState, type PointerEvent as ReactPointerEvent } from "react";

type WhatsAppSupportButtonProps = {
  href: string;
};

export function WhatsAppSupportButton({ href }: WhatsAppSupportButtonProps) {
  const [position, setPosition] = useState({ x: 16, y: 16 });

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLAnchorElement>) => {
    const element = event.currentTarget;
    const startX = event.clientX;
    const startY = event.clientY;
    const initialX = position.x;
    const initialY = position.y;

    element.setPointerCapture(event.pointerId);

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const maxX = Math.max(8, window.innerWidth - element.offsetWidth - 8);
      const maxY = Math.max(8, window.innerHeight - element.offsetHeight - 8);

      setPosition({
        x: Math.min(maxX, Math.max(8, initialX - dx)),
        y: Math.min(maxY, Math.max(8, initialY - dy)),
      });
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }, [position.x, position.y]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Open WhatsApp support"
      onPointerDown={handlePointerDown}
      className="support-pulse fixed z-40 inline-flex items-center gap-2 rounded-full border border-brand-dark bg-primary px-3 py-2 text-xs font-semibold text-white shadow-[0_20px_44px_-22px_rgba(63,174,42,0.38)] hover:bg-primary-hover active:bg-brand-dark"
      style={{ right: `${position.x}px`, bottom: `${position.y}px`, touchAction: "none" }}
    >
      <span className="flex size-7 items-center justify-center rounded-full bg-white/16">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-[15px] stroke-[1.9] text-white">
          <path d="M12 19.25a7.25 7.25 0 1 0-3.42-.86L5.75 19l.63-2.72A7.25 7.25 0 0 0 12 19.25Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.75 10.75c.4 1.22 1.88 2.76 3.1 3.18.54.18 1.04.14 1.5-.23l.85-.7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>WhatsApp</span>
    </a>
  );
}