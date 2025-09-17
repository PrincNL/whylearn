import Link from "next/link";

import { siteConfig } from "@/config/site";

export function SiteFooter() {
  const columns = [
    { title: "Product", links: siteConfig.footer.product },
    { title: "Company", links: siteConfig.footer.company },
    { title: "Resources", links: siteConfig.footer.resources }
  ];

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="container grid gap-8 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div className="flex flex-col gap-3">
          <span className="text-lg font-semibold text-foreground">{siteConfig.name}</span>
          <p className="text-sm text-muted-foreground">
            {siteConfig.description}
          </p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">{column.title}</span>
            {column.links.map((link) => (
              <Link key={link.href} href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                {link.title}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="container flex flex-col items-center justify-between gap-3 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="https://twitter.com" className="transition-colors hover:text-foreground">
              Twitter
            </Link>
            <Link href="https://www.linkedin.com" className="transition-colors hover:text-foreground">
              LinkedIn
            </Link>
            <Link href="mailto:hello@whylearn.app" className="transition-colors hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
