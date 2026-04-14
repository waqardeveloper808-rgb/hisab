"use client";

type WhatsAppSupportButtonProps = {
  href: string;
};

export function WhatsAppSupportButton({ href }: WhatsAppSupportButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Open WhatsApp support"
      className="support-pulse fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full border border-[#0d8f63] bg-[#11a36e] px-5 py-3 text-sm font-semibold text-white shadow-[0_24px_50px_-18px_rgba(17,163,110,0.55)] hover:-translate-y-0.5 hover:bg-[#0d8f63] sm:bottom-6 sm:right-6"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-white/16">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-[18px] stroke-[1.9] text-white">
          <path d="M12 19.25a7.25 7.25 0 1 0-3.42-.86L5.75 19l.63-2.72A7.25 7.25 0 0 0 12 19.25Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.75 10.75c.4 1.22 1.88 2.76 3.1 3.18.54.18 1.04.14 1.5-.23l.85-.7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>WhatsApp support</span>
    </a>
  );
}