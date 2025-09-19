"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { defaultLocale, messages, type Locale } from "./messages";

export const availableLocales: Locale[] = ["en", "nl"];

const STORAGE_KEY = "whylearn-locale";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const readStoredLocale = (): Locale => {
  if (typeof window === "undefined") {
    return defaultLocale;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && availableLocales.includes(stored as Locale)) {
    return stored as Locale;
  }
  return defaultLocale;
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => readStoredLocale());

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.lang = locale;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const translate = (key: string) => messages[locale]?.[key] ?? messages.en[key] ?? key;
    return {
      locale,
      setLocale,
      t: translate,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: defaultLocale,
      setLocale: () => {},
      t: (key: string) => messages[defaultLocale]?.[key] ?? key,
    } satisfies I18nContextValue;
  }
  return context;
}

