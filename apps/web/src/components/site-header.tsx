import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary shadow-sm" aria-hidden="true" />
            <span className="hidden text-foreground sm:inline">{siteConfig.name}</span>
            <span className="sr-only">{siteConfig.name}</span>
          </Link>
          <nav className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
            {siteConfig.mainNav.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground">
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <SubscriptionBadge />
          <ThemeToggle />
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/auth/signup">Start free trial</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function SubscriptionBadge() {
  return (
    <span className="hidden rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary md:inline-block">
      Preview tier
    </span>
  );
}
