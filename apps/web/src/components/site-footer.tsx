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
    <footer className="border-t border-border/60 bg-background">
      <div className="container grid gap-8 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div className="flex flex-col gap-3">
          <span className="text-lg font-semibold text-foreground">{siteConfig.name}</span>
          <p className="text-sm text-muted-foreground">{siteConfig.description}</p>
        </div>
        {columns.map((column) => (
          <nav key={column.titleKey} aria-label={t(column.titleKey)} className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">{t(column.titleKey)}</span>
            {column.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {link.labelKey ? t(link.labelKey) : link.title}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="container flex flex-col items-center justify-between gap-3 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="https://twitter.com" className="transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Twitter
            </Link>
            <Link href="https://www.linkedin.com" className="transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              LinkedIn
            </Link>
            <Link href="mailto:hello@whylearn.app" className="transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

