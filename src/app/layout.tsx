import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { COMPANY } from "@/lib/company";
import { buildThemeRootCss } from "@/lib/theme";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-opensans",
  display: "swap",
});

const catalogTitle = process.env.CATALOG_TITLE?.trim() || COMPANY.name;

export const metadata: Metadata = {
  title: `${catalogTitle} — ${COMPANY.name}`,
  description: `${COMPANY.name} — Katalogartikel scannen und direkt im Shop bestellen.`,
  icons: {
    icon: "/logo/Med Sales Favicon Symbol.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={openSans.variable}>
      <head>
        {/* Color tokens are sourced from env vars (see src/lib/theme.ts) and
            injected here so globals.css can consume them via var(--color-*). */}
        <style
          id="theme-colors"
          dangerouslySetInnerHTML={{ __html: buildThemeRootCss() }}
        />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
