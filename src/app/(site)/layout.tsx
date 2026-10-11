import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PublicUnavailable } from "@/components/public-unavailable";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { siteNavigation, siteSettings } from "@/lib/site-shell";
import type { Metadata } from "next";
import "./public-layout.css";
import "./public-status.css";
import "./header-navigation.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { data } = await siteSettings();
  return {
    title: {
      default:
        data.site_name ||
        translate(locale, "کانون کارشناسان رسمی دادگستری مازندران"),
      template:
        "%s | " +
        (data.site_name ||
          translate(locale, "کانون کارشناسان رسمی دادگستری مازندران")),
    },
    description: data.site_description,
    icons: {
      icon: { url: "/assets/kkrm-emblem.png", type: "image/png" },
      apple: "/pwa/apple-touch-icon.png",
    },
  };
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const [navigation, settings] = await Promise.all([
    siteNavigation(),
    siteSettings(),
  ]);
  const now = new Date();
  const parts = new Intl.DateTimeFormat(
    locale === "en" ? "en-GB" : "fa-IR-u-ca-persian",
    {
      timeZone: "Asia/Tehran",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value || "";
  const today = {
    datetime: now.toISOString(),
    weekday: part("weekday"),
    date: [part("day"), part("month"), part("year")].join(" "),
  };
  return (
    <>
      <SiteHeader
        menus={navigation.data.header || []}
        mobileMenus={navigation.data.mobile || []}
        quickMenus={navigation.data.quick || []}
        settings={settings.data}
        today={today}
      />
      <main id="main" className="site-main">
        {(navigation.unavailable || settings.unavailable) && (
          <div className="page-container">
            <PublicUnavailable compact />
          </div>
        )}
        {children}
      </main>
      <SiteFooter
        settings={settings.data}
        links={navigation.data.footer || []}
      />
    </>
  );
}
