"use client";

import { localePath, stripLocale } from "@/lib/i18n";
import { portalMainLinks, portalMobileMenus } from "@/lib/portal-navigation";
import { EXPERT_LOGIN, safeHref } from "@/lib/shared";
import type { Menu, SiteSettings } from "@/lib/types";
import {
  ArrowUpRight,
  Calculator,
  CalendarDays,
  ChevronDown,
  Menu as MenuIcon,
  Network,
  Phone,
  Search,
  SearchCheck,
  Smartphone,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { AnnualBanners } from "./annual-banners";
import { LanguageSwitch } from "./language-switch";
import { useLocale } from "./locale-provider";
import Link from "./localized-link";
import { HomeNavLink, NavItem } from "./nav-item";
import { PortalMegaMenu } from "./portal-mega-menu";
import { ThemeToggle } from "./theme-toggle";
import "@/app/portal-banners.css";
import "@/app/portal-navigation.css";

function menuTargets(item: Menu, destination: string): boolean {
  const href = safeHref(item.url);
  if (!href || !/^\/(?!\/)/.test(href)) return false;
  const url = new URL(href, "https://navigation.local");
  return (
    stripLocale(url.pathname).replace(/\/+$/, "") === destination &&
    !url.search &&
    !url.hash
  );
}

function QuickMenuEntries({ items }: { items: Menu[] }) {
  const { t } = useLocale();
  return (
    <ul>
      {items.map((item) => {
        const href = safeHref(item.url);
        return (
          <li key={item.id}>
            {href ? (
              <Link
                href={href}
                prefetch={false}
                target={item.open_new_tab ? "_blank" : undefined}
                rel={item.open_new_tab ? "noopener noreferrer" : undefined}
              >
                {t(item.title)}
              </Link>
            ) : (
              <span>{t(item.title)}</span>
            )}
            {item.children.length > 0 && (
              <QuickMenuEntries items={item.children} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function SiteHeader({
  menus,
  mobileMenus,
  quickMenus = [],
  settings,
  today,
}: {
  menus: Menu[];
  mobileMenus: Menu[];
  quickMenus?: Menu[];
  settings: SiteSettings;
  today: { datetime: string; weekday: string; date: string };
}) {
  const mobile = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLDialogElement>(null);
  const { locale, t } = useLocale();
  const pathname = stripLocale(usePathname());
  const mainLinks = portalMainLinks(menus);
  const contactLink = mainLinks.find((item) =>
    menuTargets(item, "/contact"),
  ) || {
    id: -21001,
    title: "تماس با ما",
    url: "/contact",
    children: [],
    open_new_tab: false,
  };
  const systemsLink = mainLinks.find((item) =>
    menuTargets(item, "/systems"),
  ) || {
    id: -21002,
    title: "سامانه‌ها",
    url: "/systems",
    children: [],
    open_new_tab: false,
  };
  const primaryLinks = mainLinks.filter(
    (item) =>
      !menuTargets(item, "/contact") &&
      !menuTargets(item, "/systems") &&
      !menuTargets(item, "/download"),
  );
  const mobileSections = portalMobileMenus(menus, mobileMenus);
  const slogan =
    locale === "en"
      ? "Resistance economy in the light of national unity and national security"
      : "اقتصاد مقاومتی در سایه وحدت ملی و امنیت ملی";
  const companionLink = (
    <Link
      className="nav-link portal-app-link"
      href="/download"
      prefetch={false}
      aria-current={pathname === "/download" ? "page" : undefined}
    >
      <Smartphone size={18} aria-hidden="true" />
      <span>{locale === "en" ? "Mobile app" : "اپلیکیشن همراه"}</span>
    </Link>
  );
  const shortcuts = (
    <>
      <Link
        className="portal-shortcut portal-fees"
        href="/tariffs/calculator"
        prefetch={false}
        aria-label={locale === "en" ? "Fee calculator" : "محاسبه دستمزد"}
        aria-current={pathname === "/tariffs/calculator" ? "page" : undefined}
      >
        <Calculator size={18} aria-hidden="true" />
        <span>{locale === "en" ? "Fee calculator" : "محاسبه دستمزد"}</span>
      </Link>
      <Link
        className="portal-shortcut portal-expert-search"
        href="/experts"
        prefetch={false}
        aria-label={locale === "en" ? "Expert search" : "جستجوی کارشناس"}
        aria-current={pathname.startsWith("/experts") ? "page" : undefined}
      >
        <SearchCheck size={18} aria-hidden="true" />
        <span>{locale === "en" ? "Expert search" : "جستجوی کارشناس"}</span>
      </Link>
    </>
  );
  return (
    <>
      <a className="skip-link" href="#main">
        {t("رفتن به محتوای اصلی")}
      </a>
      <header className="site-header site-header-refined header-redesigned portal-header">
        <div className="utility-bar">
          <div className="utility-links">
            <Link prefetch={false} href="/contact">
              <Phone size={14} aria-hidden="true" />
              {t("تماس با ما")}
            </Link>
            {quickMenus.length ? (
              <details
                className="portal-quick-menu"
                onBlur={(event) => {
                  if (
                    !event.currentTarget.contains(
                      event.relatedTarget as Node | null,
                    )
                  )
                    event.currentTarget.open = false;
                }}
                onClick={(event) => {
                  if ((event.target as Element).closest("a"))
                    event.currentTarget.open = false;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.currentTarget.open = false;
                    event.currentTarget.querySelector("summary")?.focus();
                    event.stopPropagation();
                  }
                }}
              >
                <summary>
                  <Network size={14} aria-hidden="true" />
                  {t("دسترسی سریع")}
                  <ChevronDown size={12} aria-hidden="true" />
                </summary>
                <div className="portal-quick-panel">
                  <QuickMenuEntries items={quickMenus} />
                  <Link prefetch={false} href="/systems">
                    {t("سامانه‌ها")}
                  </Link>
                </div>
              </details>
            ) : (
              <Link prefetch={false} href="/systems">
                <Network size={14} aria-hidden="true" />
                {t("دسترسی سریع")}
              </Link>
            )}
          </div>
          <div className="utility-tools">
            <a className="integrated-login" href={EXPERT_LOGIN}>
              {t("ورود به نرم افزار جامع")}
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
            <div className="utility-controls">
              <LanguageSwitch />
              <ThemeToggle variant="icon" />
              <button
                type="button"
                className="search-toggle icon-button"
                aria-label={t("جستجو در اخبار، اطلاعیه‌ها و مصوبات")}
                onClick={() => search.current?.showModal()}
              >
                <Search size={18} />
              </button>
            </div>
            <div className="header-date" dir={locale === "en" ? "ltr" : "rtl"}>
              <CalendarDays size={16} aria-hidden="true" />
              <time dateTime={today.datetime}>
                <span className="header-weekday">{today.weekday}</span>
                <span className="header-date-value">{today.date}</span>
              </time>
            </div>
          </div>
        </div>
        <AnnualBanners />
        <div className="header-stage">
          <div className="navigation-bar portal-navigation">
            <button
              type="button"
              className="portal-mobile-toggle icon-button"
              aria-label={t("باز کردن منو")}
              onClick={() => mobile.current?.showModal()}
            >
              <MenuIcon />
            </button>
            <nav
              className="portal-nav-half portal-nav-right"
              aria-label={t("منوی اصلی")}
            >
              <HomeNavLink />
              <PortalMegaMenu menus={menus} />
              <div className="portal-primary-links">
                {primaryLinks.map((item) => (
                  <NavItem key={item.id} item={item} variant="desktop" />
                ))}
              </div>
              <NavItem item={systemsLink} variant="desktop" />
            </nav>
            <Link
              className="brand portal-brand brand-illuminated"
              href="/"
              prefetch={false}
              aria-label={t("صفحه اصلی کانون")}
            >
              <svg
                className="portal-brand-badge"
                viewBox="0 0 126 144"
                aria-hidden="true"
              >
                <path d="M63 3 C66 3 68 5 72 7 L114 31 Q122 35 122 44 L122 99 Q122 108 114 112 L72 137 Q63 143 54 137 L12 112 Q4 108 4 99 L4 44 Q4 35 12 31 L54 7 Q60 3 63 3 Z" />
              </svg>
              <span className="brand-lights" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <img
                className="brand-logo"
                src="/assets/logo.gif"
                alt={t("نشان کانون")}
                width={88}
                height={88}
                decoding="async"
              />
            </Link>
            <nav
              className="portal-nav-half portal-nav-left"
              aria-label={
                locale === "en" ? "Services and contact" : "خدمات و تماس"
              }
            >
              {companionLink}
              <NavItem item={contactLink} variant="desktop" />
              {shortcuts}
            </nav>
          </div>
          <div className="portal-year-motto" aria-label={slogan}>
            <span className="portal-motto-track" aria-hidden="true">
              {slogan}
            </span>
          </div>
          <p className="brand-title council-name-box">
            {settings.site_name ||
              t("کانون کارشناسان رسمی دادگستری استان مازندران")}
          </p>
        </div>
      </header>
      <dialog
        ref={mobile}
        className="mobile-drawer portal-mobile-drawer"
        aria-labelledby="mobile-navigation-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) mobile.current?.close();
        }}
      >
        <div className="dialog-header">
          <h2 id="mobile-navigation-title">{t("منوی کانون")}</h2>
          <button
            type="button"
            aria-label={t("بستن منو")}
            onClick={() => mobile.current?.close()}
          >
            <X />
          </button>
        </div>
        <nav
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a"))
              mobile.current?.close();
          }}
        >
          <HomeNavLink />
          <div className="portal-mobile-primary-links">
            {primaryLinks.map((item) => (
              <NavItem key={item.id} item={item} variant="mobile" />
            ))}
            <NavItem item={systemsLink} variant="mobile" />
            {companionLink}
            <NavItem item={contactLink} variant="mobile" />
          </div>
          <div className="portal-mobile-shortcuts">{shortcuts}</div>
          <PortalMegaMenu menus={mobileSections} mobile />
        </nav>
      </dialog>
      <dialog
        ref={search}
        className="search-dialog"
        aria-labelledby="site-search-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) search.current?.close();
        }}
      >
        <div className="dialog-header">
          <h2 id="site-search-title">{t("جستجو در سایت")}</h2>
          <button
            type="button"
            aria-label={t("بستن جستجو")}
            onClick={() => search.current?.close()}
          >
            <X />
          </button>
        </div>
        <form
          action={localePath("/search", locale)}
          onSubmit={() => search.current?.close()}
        >
          <label className="sr-only" htmlFor="header-search">
            {t("عبارت جستجو")}
          </label>
          <input
            id="header-search"
            name="q"
            placeholder={t("در اخبار، اطلاعیه‌ها و مصوبات جستجو کنید…")}
            minLength={2}
            maxLength={150}
            required
          />
          <button className="primary-button" type="submit">
            <Search size={18} />
            {t("جستجو")}
          </button>
        </form>
        <p className="dialog-hint">{t("حداقل دو حرف وارد کنید.")}</p>
      </dialog>
    </>
  );
}
