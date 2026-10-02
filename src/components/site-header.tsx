"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Menu as MenuIcon,
  Search,
  X,
  Sun,
  Moon,
  CalendarDays,
} from "lucide-react";
import { EXPERT_LOGIN } from "@/lib/shared";
import { NavItem, HomeNavLink } from "./nav-item";
import type { Menu, SiteSettings } from "@/lib/types";

const faqMenu: Menu = {
  id: -1,
  title: "پرسش‌های متداول",
  url: "/faqs",
  children: [],
  open_new_tab: false,
};

function withFaqMenu(items: Menu[]): Menu[] {
  return items.some((item) => item.url?.replace(/\/+$/, "") === "/faqs")
    ? items
    : [...items, faqMenu];
}

function subscribeTheme(callback: () => void) {
  window.addEventListener("theme-change", callback);
  return () => window.removeEventListener("theme-change", callback);
}
export function SiteHeader({
  menus,
  mobileMenus,
  settings,
  today,
}: {
  menus: Menu[];
  mobileMenus: Menu[];
  settings: SiteSettings;
  today: string;
}) {
  const mobile = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLDialogElement>(null);
  const dark = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.dataset.theme === "dark",
    () => false,
  );
  useEffect(() => {
    const saved = localStorage.getItem("kkrm-theme");
    document.documentElement.dataset.theme = saved === "dark" ? "dark" : "light";
    window.dispatchEvent(new Event("theme-change"));
  }, []);
  function toggleTheme() {
    const theme = dark ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("kkrm-theme", theme);
    window.dispatchEvent(new Event("theme-change"));
  }
  const visible = withFaqMenu(menus).filter(
    (item) => item.url !== "/tariffs/calculator" && item.url !== "/",
  );
  const mobileItems = withFaqMenu(mobileMenus.length ? mobileMenus : menus).filter(
    (item) => item.url !== "/tariffs/calculator" && item.url !== "/",
  );
  const split = Math.floor(visible.length / 2);
  return (
    <>
      <a className="skip-link" href="#main">
        رفتن به محتوای اصلی
      </a>
      <header className="site-header">
        <div className="utility-bar">
          <div className="utility-links">
            <Link prefetch={false} href="/contact">
              تماس با ما
            </Link>
            <Link prefetch={false} href="/systems">
              دسترسی سریع
            </Link>
            <Link prefetch={false} href="/documents">
              قوانین و مقررات
            </Link>
          </div>
          <div className="auth-links">
            <a href={EXPERT_LOGIN}>ورود</a>
          </div>
          <button
            className="search-toggle icon-button"
            aria-label="جستجو در اخبار، اطلاعیه‌ها و مصوبات"
            onClick={() => search.current?.showModal()}
          >
            <Search size={23} />
          </button>
          <span className="header-date">
            <CalendarDays size={19} />
            <time>{today}</time>
          </span>
        </div>
        <p className="year-motto">
          <span>
            {settings.announcement_ticker || "سرمایه گذاری برای تولید"}
          </span>
        </p>
        <div className="navigation-bar">
          <button
            className="menu-toggle icon-button"
            aria-label="باز کردن منو"
            onClick={() => mobile.current?.showModal()}
          >
            <MenuIcon />
          </button>
          <button
            className="theme-toggle"
            aria-label={dark ? "حالت روشن" : "حالت تاریک"}
            aria-pressed={dark}
            onClick={toggleTheme}
          >
            <Sun className="theme-icon theme-sun" />
            <Moon className="theme-icon theme-moon" />
          </button>
          <nav
            className="navigation-half navigation-right"
            aria-label="منوی اصلی"
          >
            <HomeNavLink />
            {visible.slice(0, split).map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </nav>
          <Link
            prefetch={false}
            className="brand"
            href="/"
            aria-label="صفحه اصلی کانون"
          >
            <img
              className="brand-background"
              src="/assets/logo-background.svg"
              alt=""
            />
            <img
              className="brand-logo"
              src="/assets/logo_kanoon.png"
              alt="نشان کانون"
            />
          </Link>
          <nav
            className="navigation-half navigation-left"
            aria-label="منوی کانون"
          >
            {visible.slice(split).map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </nav>
        </div>
        <p className="brand-title">
          {settings.site_name || "کانون کارشناسان رسمی دادگستری مازندران"}
        </p>
      </header>
      <dialog
        ref={mobile}
        className="mobile-drawer"
        onClick={(event) => {
          if (event.target === event.currentTarget) mobile.current?.close();
        }}
      >
        <div className="dialog-header">
          <h2>منوی کانون</h2>
          <button aria-label="بستن منو" onClick={() => mobile.current?.close()}>
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
          {mobileItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
          <Link prefetch={false} className="nav-link" href="/news">
            اخبار و اطلاعیه‌ها
          </Link>
          <Link prefetch={false} className="nav-link" href="/contact">
            تماس با ما
          </Link>
        </nav>
      </dialog>
      <dialog
        ref={search}
        className="search-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) search.current?.close();
        }}
      >
        <div className="dialog-header">
          <h2>جستجو در سایت</h2>
          <button
            aria-label="بستن جستجو"
            onClick={() => search.current?.close()}
          >
            <X />
          </button>
        </div>
        <form action="/search" onSubmit={() => search.current?.close()}>
          <label className="sr-only" htmlFor="header-search">
            عبارت جستجو
          </label>
          <input
            id="header-search"
            name="q"
            placeholder="در اخبار، اطلاعیه‌ها و مصوبات جستجو کنید…"
            minLength={2}
            maxLength={150}
            required
            autoFocus
          />
          <button className="primary-button" type="submit">
            <Search size={18} /> جستجو
          </button>
        </form>
        <p className="dialog-hint">حداقل دو حرف وارد کنید.</p>
      </dialog>
    </>
  );
}
