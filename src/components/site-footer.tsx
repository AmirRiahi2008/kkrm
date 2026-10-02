import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { safeHref, mediaUrl } from "@/lib/shared";
import type { Menu, SiteSettings } from "@/lib/types";

export function SiteFooter({
  settings,
  links,
}: {
  settings: SiteSettings;
  links: Menu[];
}) {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img
          src={
            settings.logo_media_id
              ? mediaUrl({ id: settings.logo_media_id })
              : "/assets/fig-319.png"
          }
          alt="نشان کانون کارشناسان رسمی"
          className="footer-logo"
        />
      </div>
      <div className="footer-grid page-container">
        <section>
          <h2 className="footer-heading">ارتباط با ما</h2>
          <ul className="footer-list">
            <li>
              <Phone size={21} />
              <a
                href={
                  "tel:" + (settings.site_phone || "").replace(/[^+\d]/g, "")
                }
              >
                {settings.site_phone}
              </a>
            </li>
            <li>
              <Mail size={21} />
              <a href={"mailto:" + settings.site_email}>
                {settings.site_email}
              </a>
            </li>
            <li>
              <MapPin size={21} />
              <address>{settings.site_address}</address>
            </li>
            <li>
              <Clock size={21} />
              {settings.office_hours || "شنبه تا چهارشنبه، ساعات اداری"}
            </li>
          </ul>
        </section>
        <section>
          <h2 className="footer-heading">دسترسی سریع</h2>
          <div className="footer-links">
            <Link prefetch={false} href="/news">
              اخبار و اطلاعیه‌ها
            </Link>
            <Link prefetch={false} href="/documents">
              قوانین و مقررات
            </Link>
            <Link prefetch={false} href="/albums">
              گالری
            </Link>
            <Link prefetch={false} href="/experts">
              جستجوی کارشناس
            </Link>
            {links
              .filter(
                (item) =>
                  safeHref(item.url) && item.url !== "/tariffs/calculator",
              )
              .map((item) => (
                <Link key={item.id} href={safeHref(item.url)!} prefetch={false}>
                  {item.title}
                </Link>
              ))}
          </div>
        </section>
        <section>
          <h2 className="footer-heading">کانون مازندران</h2>
          <p>{settings.site_description}</p>
          <Link
            prefetch={false}
            className="footer-location-link"
            href="/contact"
          >
            <MapPin />
            نشانی و راه‌های ارتباطی
          </Link>
          <Link prefetch={false} className="admin-entry" href="/admin/login">
            ورود روابط عمومی
          </Link>
        </section>
      </div>
      <div className="copyright">
        {settings.copyright ||
          "طراحی و توسعه یافته توسط  صدرا رایانه نوین طبرستان"}
      </div>
    </footer>
  );
}
