"use client";

import Link from "next/link";

import { siteConfig } from "@/config/site";
import { useI18n } from "@/i18n";

const columns = [
  { titleKey: "footer.product", links: siteConfig.footer.product },
  { titleKey: "footer.company", links: siteConfig.footer.company },
  { titleKey: "footer.resources", links: siteConfig.footer.resources },
];

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-white/10 bg-slate-950 text-slate-100">
      <div className="container grid gap-8 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="flex flex-col gap-3">
          <span className="text-lg font-semibold text-slate-50">{siteConfig.name}</span>
          <p className="text-sm text-slate-400">{siteConfig.description}</p>
        </div>
        {columns.map((column) => (
          <nav key={column.titleKey} aria-label={t(column.titleKey)} className="flex flex-col gap-2 text-sm text-slate-300">
            <span className="font-semibold text-slate-100">{t(column.titleKey)}</span>
            {column.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-400 transition-colors hover:text-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              >
                {link.labelKey ? t(link.labelKey) : link.title}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-3 py-4 text-xs text-slate-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="https://twitter.com" className="transition-colors hover:text-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
              Twitter
            </Link>
            <Link href="https://www.linkedin.com" className="transition-colors hover:text-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
              LinkedIn
            </Link>
            <Link href="mailto:hello@whylearn.app" className="transition-colors hover:text-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
