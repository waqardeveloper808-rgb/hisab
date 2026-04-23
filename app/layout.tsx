import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { AppFrame } from "@/components/AppFrame";
import { buildWhatsAppHref, getProductConfig } from "@/lib/product-config";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Gulf Hisab",
    template: "%s | Gulf Hisab",
  },
  description:
    "ZATCA-Compliant Invoicing For Your Business, with VAT reports, WhatsApp support, and a fast free-trial path.",
  icons: {
    icon: "/branding/gulf-hisab-compact-logo.svg",
    shortcut: "/branding/gulf-hisab-compact-logo.svg",
    apple: "/branding/gulf-hisab-compact-logo.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const productConfig = await getProductConfig();

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas text-ink">
        <AppFrame supportHref={buildWhatsAppHref(productConfig.supportWhatsappNumber)}>{children}</AppFrame>
      </body>
    </html>
  );
}
