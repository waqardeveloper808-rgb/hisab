"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";

const links = [
  { href: "/#products", label: "Products", sectionId: "products" },
  { href: "/#pricing", label: "Pricing", sectionId: "pricing" },
  { href: "/#help", label: "Help", sectionId: "help" },
  { href: "/workspace", label: "Workspace" },
];

export function Navbar() {
  const pathname = usePathname();

  function scrollToSection(sectionId: string) {
    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }

    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line/70 bg-white/92 backdrop-blur-xl">
      <Container className="py-4 md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-6">
        <BrandMark />

        <div className="order-3 mt-3 flex w-full flex-col gap-2 md:order-2 md:mt-0 md:items-center md:justify-self-center">
          <nav
            aria-label="Primary"
            className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-line/80 bg-white p-1.5 text-sm font-medium text-muted shadow-[0_14px_30px_-28px_rgba(17,32,24,0.18)]"
          >
            {links.map((link) => (
              link.sectionId && pathname === "/" ? (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => scrollToSection(link.sectionId)}
                  className="rounded-xl px-3 py-2 hover:bg-primary-soft hover:text-ink"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "rounded-xl px-3 py-2",
                    pathname === link.href
                      ? "bg-primary-soft text-ink"
                      : "hover:bg-primary-soft hover:text-ink",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>
        </div>

        <div className="order-2 flex items-center justify-end gap-3 md:order-3">
          <Link
            href="/login"
            className={[
              "rounded-xl border px-3 py-2 text-sm font-semibold shadow-[0_10px_22px_-18px_rgba(17,32,24,0.26)]",
              pathname === "/login"
                ? "border-primary-border bg-primary-soft text-primary"
                : "border-line-strong bg-white text-ink hover:border-primary/30 hover:bg-primary-soft hover:text-primary",
            ].join(" ")}
          >
            Log In
          </Link>
          <Button
            href="/register"
            size="md"
            variant={pathname === "/register" ? "secondary" : "primary"}
          >
            Start free trial
          </Button>
        </div>
      </Container>
    </header>
  );
}