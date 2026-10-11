"use client";

import { translate, type Locale } from "@/lib/i18n";
import { createContext, useContext } from "react";

const LocaleContext = createContext<Locale>("fa");
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}
export function useLocale() {
  const locale = useContext(LocaleContext);
  return { locale, t: (value: string) => translate(locale, value) };
}
