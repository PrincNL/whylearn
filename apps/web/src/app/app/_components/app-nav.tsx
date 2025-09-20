'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const routes = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/learn", label: "Learn" },
  { href: "/app/progress", label: "Progress" },
  { href: "/app/rewards", label: "Rewards" },
  { href: "/app/coach", label: "Coach" },
  { href: "/app/account", label: "Account" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {routes.map((route) => {
        const isActive = pathname === route.href;
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              isActive
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
}
