import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { AppFrame } from "@/components/AppFrame";
import { appName, iconLogoPath } from "@/lib/brand";
import { buildWhatsAppHref, getProductConfig } from "@/lib/product-config";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  applicationName: appName,
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
  description:
    "Hisabix is a clean finance workspace for invoicing, VAT visibility, reporting, and direct support.",
  icons: {
    icon: iconLogoPath,
    shortcut: iconLogoPath,
    apple: iconLogoPath,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const productConfig = await getProductConfig();

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${poppins.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas text-ink">
        <AppFrame supportHref={buildWhatsAppHref(productConfig.supportWhatsappNumber)}>{children}</AppFrame>
      </body>
    </html>
  );
}
