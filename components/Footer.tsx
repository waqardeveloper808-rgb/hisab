import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { Container } from "@/components/Container";
import { appName } from "@/lib/brand";

type FooterProps = {
  supportHref: string;
};

const productLinks = [
  { href: "/products", label: "Products" },
  { href: "/plans", label: "Pricing" },
  { href: "/help", label: "Help center" },
  { href: "/workspace", label: "Workspace" },
];

const accountLinks = [
  { href: "/login", label: "Log in" },
  { href: "/register", label: "Create account" },
];

const supportLinks = [
  { href: "/help", label: "Public help center" },
  { href: "/workspace/help", label: "Workspace help" },
];

export function Footer({ supportHref }: FooterProps) {
  return (
    <footer id="help" className="border-t border-line bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,245,245,0.9))]">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-8 rounded-[2rem] border border-line bg-white p-6 shadow-card md:grid-cols-[1.2fr_0.85fr_0.85fr_1fr] md:p-8">
          <div className="max-w-sm">
            <BrandMark />
            <p className="mt-3 text-sm leading-6 text-muted">
              ZATCA-compliant invoicing for Saudi businesses that want fast invoice creation, VAT clarity, and direct WhatsApp support.
            </p>
            <div className="mt-5 inline-flex rounded-full border border-primary-border bg-primary-soft px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Built for faster invoicing
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Product</h3>
            <div className="mt-4 space-y-3 text-sm text-muted">
              {productLinks.map((link) => (
                <div key={link.href}>
                  <Link href={link.href} className="hover:text-primary">
                    {link.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Company</h3>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <div>ZATCA-compliant invoicing system</div>
              <div>VAT-ready workflow</div>
              <div>Reporting and support</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Support and account</h3>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <div>
                <a href={supportHref} target="_blank" rel="noreferrer" className="hover:text-primary">
                  WhatsApp support
                </a>
              </div>
              {supportLinks.map((link) => (
                <div key={`${link.href}-${link.label}`}>
                  <Link href={link.href} className="hover:text-primary">
                    {link.label}
                  </Link>
                </div>
              ))}
              {accountLinks.map((link) => (
                <div key={link.href}>
                  <Link href={link.href} className="hover:text-primary">
                    {link.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {appName}. ZATCA-compliant invoicing for Saudi businesses.</p>
          <p>Landing site, workspace, and direct support in one entry point.</p>
        </div>
      </Container>
    </footer>
  );
}