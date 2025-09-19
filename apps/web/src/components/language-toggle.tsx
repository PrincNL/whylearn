"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const nextLocale = locale === "en" ? "nl" : "en";

  const label = locale === "en" ? t("language.dutch") : t("language.english");

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setLocale(nextLocale)}
      aria-label={t("language.toggle")}
    >
      <span aria-hidden="true">{locale.toUpperCase()}</span>
      <span className="sr-only">{label}</span>
    </Button>
  );
}
