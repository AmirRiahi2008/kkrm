import { LocaleProvider } from "@/components/locale-provider";
import { ToastProvider } from "@/components/toast-provider";
import { PwaProvider } from "@/components/pwa-provider";
import { localePath, translate } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import "./portal-responsive-fixes.css";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./original.css";
import "./globals.css";
import "./table-styles.css";
import "./board-contact.css";
import "./loader.css";
import "./experience.css";
import "./pwa.css";

export const maxDuration = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = (await headers()).get("x-site-path") || "/";
  const name = translate(locale, "کانون کارشناسان رسمی دادگستری مازندران");
  return {
    metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
    title: { default: name, template: "%s | " + name },
    description:
      locale === "en"
        ? "News, announcements, regulations and services of the Mazandaran Official Justice Experts Council"
        : "اخبار، اطلاعیه‌ها، مصوبات و خدمات کانون کارشناسان رسمی دادگستری مازندران",
    manifest: localePath("/manifest.webmanifest", locale),
    applicationName: name,
    appleWebApp: { capable: true, statusBarStyle: "default", title: name },
    icons: {
      icon: { url: "/assets/kkrm-emblem.png", type: "image/png" },
      apple: "/pwa/apple-touch-icon.png",
    },
    alternates: path.startsWith("/admin")
      ? undefined
      : {
          canonical: localePath(path, locale),
          languages: {
            "fa-IR": localePath(path, "fa"),
            en: localePath(path, "en"),
          },
        },
  };
}
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00477a" },
    { media: "(prefers-color-scheme: dark)", color: "#0b2943" },
  ],
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={locale === "en" ? "ltr" : "rtl"}
      suppressHydrationWarning
    >
      <body>
        <LocaleProvider locale={locale}>
          <PwaProvider>
            {children}
            <ToastProvider />
          </PwaProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
