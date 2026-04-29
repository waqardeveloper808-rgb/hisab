import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter, Noto_Sans_Arabic, Poppins, Tajawal } from "next/font/google";
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

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-sans-arabic",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  variable: "--font-tajawal",
  weight: ["400", "500", "700"],
  display: "swap",
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  variable: "--font-ibm-plex-sans-arabic",
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${poppins.variable} ${inter.variable} ${notoSansArabic.variable} ${tajawal.variable} ${ibmPlexSansArabic.variable} h-full antialiased`}
    >
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-full bg-canvas text-ink">
        <AppFrame supportHref={buildWhatsAppHref(productConfig.supportWhatsappNumber)}>{children}</AppFrame>
      </body>
    </html>
  );
}
