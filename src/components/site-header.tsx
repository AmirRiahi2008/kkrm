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
  ChevronDown,
} from "lucide-react";
import { EXPERT_LOGIN, safeHref } from "@/lib/shared";
import type { Menu, SiteSettings } from "@/lib/types";

function subscribeTheme(callback: () => void) {
  window.addEventListener("theme-change", callback);

  return () => {
    window.removeEventListener("theme-change", callback);
  };
}

function NavItem({ item }: { item: Menu }) {
  const children = item.children.filter(
    (child) => child.url !== "/tariffs/calculator",
  );

  const href = safeHref(item.url);

  if (item.url === "/tariffs/calculator") return null;

  if (children.length) {
    return (
      <details
        className="nav-dropdown"
        onMouseEnter={(event) => {
          if (
            event.currentTarget.closest(".navigation-half") &&
            window.matchMedia("(hover: hover)").matches
          ) {
            event.currentTarget.open = true;
          }
        }}
        onMouseLeave={(event) => {
          if (
            event.currentTarget.closest(".navigation-half") &&
            window.matchMedia("(hover: hover)").matches
          ) {
            event.currentTarget.open = false;
          }
        }}
      >
        <summary>
          {item.title}
          <ChevronDown size={13} />
        </summary>

        <div className="dropdown-panel">
          {children.map((child) => (
            <NavItem key={child.id} item={child} />
          ))}
        </div>
      </details>
    );
  }

  if (!href) return null;

  return (
    <Link
      className="nav-link"
      href={href}
      prefetch={false}
      target={item.open_new_tab ? "_blank" : undefined}
      rel={item.open_new_tab ? "noopener noreferrer" : undefined}
    >
      {item.title}
    </Link>
  );
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
    let theme = "light";

    try {
      if (localStorage.getItem("kkrm-theme") === "dark") {
        theme = "dark";
      }
    } catch {
      theme = "light";
    }

    document.documentElement.dataset.theme = theme;
    window.dispatchEvent(new Event("theme-change"));
  }, []);

  function toggleTheme() {
    const theme = dark ? "light" : "dark";

    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem("kkrm-theme", theme);
    } catch {}

    window.dispatchEvent(new Event("theme-change"));
  }

  const visible = menus.filter(
    (item) =>
      item.url !== "/tariffs/calculator" &&
      item.url !== "/",
  );

  const mobileItems = (
    mobileMenus.length ? mobileMenus : menus
  ).filter(
    (item) =>
      item.url !== "/tariffs/calculator" &&
      item.url !== "/",
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
            type="button"
            className="search-toggle icon-button"
            aria-label="جستجو در اخبار، اطلاعیه‌ها و مصوبات"
            aria-haspopup="dialog"
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
            {
              "سرمایه گذاری برای تولید"}
          </span>
        </p>

        <div className="navigation-bar">
          <button
            type="button"
            className="menu-toggle icon-button"
            aria-label="باز کردن منو"
            aria-haspopup="dialog"
            onClick={() => mobile.current?.showModal()}
          >
            <MenuIcon />
          </button>

          <button
            type="button"
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
            <Link
              prefetch={false}
              className="nav-link"
              href="/"
            >
              صفحه اصلی
            </Link>

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
              alt="نشان کانون کارشناسان رسمی دادگستری مازندران"
              width={100}
              height={100}
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
          {settings.site_name ||
            "کانون کارشناسان رسمی دادگستری مازندران"}
        </p>
      </header>

      <dialog
        ref={mobile}
        className="mobile-drawer"
        aria-labelledby="mobile-menu-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            mobile.current?.close();
          }
        }}
      >
        <div className="dialog-header">
          <h2 id="mobile-menu-title">منوی کانون</h2>

          <button
            type="button"
            aria-label="بستن منو"
            onClick={() => mobile.current?.close()}
          >
            <X />
          </button>
        </div>

        <nav
          aria-label="منوی موبایل"
          onClick={(event) => {
            if (
              event.target instanceof Element &&
              event.target.closest("a")
            ) {
              mobile.current?.close();
            }
          }}
        >
          <Link
            prefetch={false}
            className="nav-link"
            href="/"
          >
            صفحه اصلی
          </Link>

          {mobileItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}

          <Link
            prefetch={false}
            className="nav-link"
            href="/news"
          >
            اخبار و اطلاعیه‌ها
          </Link>

          <Link
            prefetch={false}
            className="nav-link"
            href="/contact"
          >
            تماس با ما
          </Link>
        </nav>
      </dialog>

      <dialog
        ref={search}
        className="search-dialog"
        aria-labelledby="search-dialog-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            search.current?.close();
          }
        }}
      >
        <div className="dialog-header">
          <h2 id="search-dialog-title">جستجو در سایت</h2>

          <button
            type="button"
            aria-label="بستن جستجو"
            onClick={() => search.current?.close()}
          >
            <X />
          </button>
        </div>

        <form
          action="/search"
          method="get"
          onSubmit={() => search.current?.close()}
        >
          <label
            className="sr-only"
            htmlFor="header-search"
          >
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

          <button
            className="primary-button"
            type="submit"
          >
            <Search size={18} />
            جستجو
          </button>
        </form>

        <p className="dialog-hint">
          حداقل دو حرف وارد کنید.
        </p>
      </dialog>
    </>
  );
}