import Link from "next/link";

const links = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/privacy", label: "Privacy Policy" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container flex flex-col gap-12 py-20">
      <header className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">Legal</span>
        <h1 className="text-3xl font-semibold text-foreground">How we operate</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Below you will find the agreements that keep WhyLearn transparent, privacy-first, and dependable for
          educators and independent professionals.
        </p>
        <nav className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full border border-border/60 px-3 py-1 hover:border-primary/40 hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="grid gap-10 md:grid-cols-[minmax(0,0.25fr),1fr]">
        <aside className="hidden flex-col gap-2 text-sm text-muted-foreground md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md px-2 py-1 transition-colors hover:bg-muted/60 hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </aside>
        <div className="space-y-8">{children}</div>
      </div>
    </div>
  );
}
