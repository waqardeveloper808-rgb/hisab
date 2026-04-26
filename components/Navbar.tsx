"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";

const links = [
  { href: "/#pricing", label: "Pricing", sectionId: "pricing" },
  { href: "/#modules", label: "Modules", sectionId: "modules" },
  { href: "/#trust", label: "Trust", sectionId: "trust" },
  { href: "/#faq", label: "FAQ", sectionId: "faq" },
];

const devEntryLinks = [
  { href: "/workspace/user", label: "Enter Workspace" },
  { href: "/workspace-v2/user", label: "Workspace V2" },
  { href: "/system/master-design", label: "Open System Monitor" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const showDevEntries = process.env.NODE_ENV !== "production";
  const isLanding = pathname === "/";

  function scrollToSection(sectionId: string) {
    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }

    setMobileOpen(false);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line/70 bg-white/95 backdrop-blur-xl">
      <Container className="py-2.5">
        <div className="flex items-center justify-between gap-3 lg:gap-5">
          {isLanding ? (
            <div className="h-11 w-[11.5rem] shrink-0" aria-hidden="true" />
          ) : (
            <BrandMark className="items-center" />
          )}

          <nav aria-label="Primary" className="hidden items-center gap-1 rounded-2xl border border-line/80 bg-white/90 p-1 text-sm font-medium text-muted shadow-xs md:flex">
            {links.map((link) => (
              link.sectionId && pathname === "/" ? (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => scrollToSection(link.sectionId)}
                  className="rounded-xl px-3.5 py-2 transition hover:bg-primary-soft hover:text-primary"
                >
                  {link.label}
                </button>
              ) : (
                <Link key={link.href} href={link.href} className="rounded-xl px-3.5 py-2 transition hover:bg-primary-soft hover:text-primary">
                  {link.label}
                </Link>
              )
            ))}
          </nav>

          <div className="hidden items-center gap-2.5 md:flex">
            <Link href="/system/master-design" className="rounded-xl px-3 py-2 text-sm font-semibold text-ink transition hover:bg-primary-soft hover:text-primary">
              System Monitor
            </Link>
            <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-ink transition hover:bg-primary-soft hover:text-primary">
              Login
            </Link>
            <Button href="/register" size="md" variant={pathname === "/register" ? "secondary" : "primary"}>Start Free Trial</Button>
            {showDevEntries ? (
              <>
                {devEntryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-primary/30 hover:bg-primary-soft hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-white text-ink shadow-xs md:hidden"
          >
            <span className="flex flex-col gap-1.5">
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
            </span>
          </button>
        </div>

        {mobileOpen ? (
          <div className="mt-3 rounded-3xl border border-line bg-white p-3 shadow-card md:hidden">
            <nav aria-label="Mobile primary" className="flex flex-col gap-1 text-sm font-medium text-muted">
              {isLanding ? <BrandMark className="mb-2 items-center" imageClassName="h-14 md:h-14" /> : null}
              {links.map((link) => (
                link.sectionId && pathname === "/" ? (
                  <button key={link.href} type="button" onClick={() => scrollToSection(link.sectionId)} className="rounded-2xl px-4 py-3 text-left hover:bg-primary-soft hover:text-ink">
                    {link.label}
                  </button>
                ) : (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="rounded-2xl px-4 py-3 hover:bg-primary-soft hover:text-ink">
                    {link.label}
                  </Link>
                )
              ))}
              <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-2xl px-4 py-3 hover:bg-primary-soft hover:text-ink">Login</Link>
              <Button href="/register" fullWidth size="md">Start Free Trial</Button>
              {showDevEntries ? devEntryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl border border-line px-4 py-3 hover:bg-primary-soft hover:text-ink"
                >
                  {link.label}
                </Link>
              )) : null}
            </nav>
          </div>
        ) : null}
      </Container>
    </header>
  );
}