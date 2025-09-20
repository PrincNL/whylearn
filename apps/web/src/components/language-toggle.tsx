"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const [displayLocale, setDisplayLocale] = useState(locale);

  useEffect(() => {
    setDisplayLocale(locale);
  }, [locale]);

  const nextLocale = displayLocale === "en" ? "nl" : "en";
  const label = nextLocale === "en" ? t("language.english") : t("language.dutch");

  const handleClick = () => {
    setDisplayLocale((current) => {
      const updated = current === "en" ? "nl" : "en";
      setLocale(updated);
      return updated;
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      aria-label={t("language.toggle")}
      title={label}
      className="rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-100"
    >
      <span aria-hidden="true">{displayLocale.toUpperCase()}</span>
    </Button>
  );
}
