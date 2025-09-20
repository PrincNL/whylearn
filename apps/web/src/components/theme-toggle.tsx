"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { ThemeMode, useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const icon = (() => {
    if (theme === "system") {
      return <Monitor aria-hidden="true" className="h-4 w-4" />;
    }
    return theme === "dark" ? <Moon aria-hidden="true" className="h-4 w-4" /> : <Sun aria-hidden="true" className="h-4 w-4" />;
  })();

  const resolvedIcon = resolvedTheme === "dark" ? <Moon aria-hidden="true" className="h-4 w-4" /> : <Sun aria-hidden="true" className="h-4 w-4" />;
  const fallbackResolvedIcon = <Sun aria-hidden="true" className="h-4 w-4" />;
  const fallbackThemeIcon = <Monitor aria-hidden="true" className="h-4 w-4" />;

  const displayResolvedIcon = isMounted ? resolvedIcon : fallbackResolvedIcon;
  const displayThemeIcon = isMounted ? icon : fallbackThemeIcon;

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
        {displayResolvedIcon}
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground" htmlFor="theme-select">
        <span className="sr-only">Theme</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
          {displayThemeIcon}
        </div>
        <select
          id="theme-select"
          className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={theme}
          onChange={(event) => setTheme(event.target.value as ThemeMode)}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </div>
  );
}
