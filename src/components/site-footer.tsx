import { getTranslations } from "@/lib/i18n-server";
import { safeHref } from "@/lib/shared";
import type { Menu, SiteSettings } from "@/lib/types";
import {
  ArrowUpRight,
  Clock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import Link from "./localized-link";

export async function SiteFooter({
  settings,
  links,
}: {
  settings: SiteSettings;
  links: Menu[];
}) {
  const { t } = await getTranslations();
  const fixed = [
    { title: "اخبار و اطلاعیه‌ها", url: "/news" },
    { title: "قوانین و اسناد", url: "/documents" },
    { title: "جستجوی کارشناس", url: "/experts" },
    { title: "گالری", url: "/albums" },
    { title: "پرسش‌های متداول", url: "/faqs" },
  ];
  const seen = new Set(fixed.map((item) => item.url));
  const flatten = (items: Menu[]): Menu[] =>
    items.flatMap((item) => [item, ...flatten(item.children || [])]);
  const extra = flatten(links).filter((item) => {
    const href = safeHref(item.url);
    if (!href || seen.has(href)) return false;
    seen.add(href);
    return true;
  });
  return (
    <footer className="site-footer footer-refined">
      <div className="footer-topline page-container">
        <Link href="/" prefetch={false} className="footer-identity">
          <img
            src="/assets/logo.gif"
            alt={t("نشان کانون")}
            width={65}
            height={65}
            loading="lazy"
            decoding="async"
          />
          <div>
            <span>{t("در کنار شما")}</span>
            <strong className="council-name-box">
              {settings.site_name ||
                t("کانون کارشناسان رسمی دادگستری مازندران")}
            </strong>
          </div>
        </Link>
        <Link
          href="/contact"
          prefetch={false}
          className="footer-contact-button"
        >
          {t("ملاقات و ارتباط")}
          <ArrowUpRight size={20} />
        </Link>
      </div>
      <div className="footer-grid page-container">
        <section className="footer-intro">
          <h2 className="footer-heading">{t("آشنایی با کانون")}</h2>
          <p>{settings.site_description}</p>
          <Link href="/pages/history" prefetch={false}>
            {t("تاریخچه کانون")}
            <ArrowUpRight size={16} />
          </Link>
          <Link href="/board-members" prefetch={false}>
            {t("اعضای هیئت مدیره و ارکان")}
            <ArrowUpRight size={16} />
          </Link>
        </section>
        <section>
          <h2 className="footer-heading">{t("دسترسی سریع")}</h2>
          <div className="footer-links">
            {fixed.map((item) => (
              <Link key={item.url} prefetch={false} href={item.url}>
                {t(item.title)}
              </Link>
            ))}
            {extra.map((item) => (
              <Link
                key={item.id}
                prefetch={false}
                href={safeHref(item.url)!}
                target={item.open_new_tab ? "_blank" : undefined}
                rel={item.open_new_tab ? "noopener noreferrer" : undefined}
              >
                {t(item.title)}
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="footer-heading">{t("ارتباط با ما")}</h2>
          <ul className="footer-list">
            {settings.site_phone && (
              <li>
                <Phone size={18} />
                <a
                  href={"tel:" + settings.site_phone.replace(/[^+\d]/g, "")}
                  dir="ltr"
                >
                  {settings.site_phone}
                </a>
              </li>
            )}
            {settings.site_email && (
              <li>
                <Mail size={18} />
                <a href={"mailto:" + settings.site_email} dir="ltr">
                  {settings.site_email}
                </a>
              </li>
            )}
            {settings.site_address && (
              <li>
                <MapPin size={18} />
                <address>{settings.site_address}</address>
              </li>
            )}
            <li>
              <Clock size={18} />
              {settings.office_hours || t("شنبه تا چهارشنبه، ساعات اداری")}
            </li>
          </ul>
        </section>
      </div>
      <div className="footer-bottom page-container">
        <p>{settings.copyright || t("همه حقوق محفوظ است.")}</p>
        <a
          className="footer-developer"
          href="https://www.irancompile.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("طراحی و توسعه یافته توسط صدرا رایانه نوین طبرستان")}
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
        <Link href="/admin/login" prefetch={false}>
          <ShieldCheck size={15} />
          {t("ورود روابط عمومی")}
        </Link>
      </div>
    </footer>
  );
}
