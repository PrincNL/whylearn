import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeScript } from "@/components/theme-script";
import { siteConfig } from "@/config/site";
import { SkipLink } from "@/components/skip-link";

import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bodyClassName = `${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`;

export const metadata: Metadata = {
  title: {
    default: "WhyLearn - Focused Learning Companion",
    template: "%s | WhyLearn",
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="light">
      <body className={bodyClassName}>
        <ThemeScript />
        <Providers>
          <SkipLink />
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main id="main-content" className="flex-1" tabIndex={-1}>{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}



