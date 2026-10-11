import { headers } from "next/headers";
import { cache } from "react";
import "server-only";
import { translate, type Locale } from "./i18n";

export const getLocale = cache(async (): Promise<Locale> =>
  (await headers()).get("x-site-locale") === "en" ? "en" : "fa",
);
export async function getTranslations() {
  const locale = await getLocale();
  return { locale, t: (value: string) => translate(locale, value) };
}
