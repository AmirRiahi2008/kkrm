"use client";

import { canAccess, resources } from "@/lib/admin-resources";
import { api } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import type { User } from "@/lib/types";
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  NotificationCenter,
  type NotificationData,
} from "./notification-center";
import { ThemeToggle } from "./theme-toggle";

const groups = [
  {
    label: "محتوا و رسانه",
    icon: Newspaper,
    keys: [
      "posts",
      "pages",
      "documents",
      "albums",
      "events",
      "slides",
      "faqs",
      "categories",
      "tags",
      "media",
    ],
  },
  {
    label: "کارشناسان و ارکان",
    icon: Users,
    keys: [
      "experts",
      "expert-groups",
      "disciplines",
      "qualifications",
      "board-members",
      "board-terms",
      "agreements",
    ],
  },
  {
    label: "ساختار سایت",
    icon: BookOpen,
    keys: ["menu-items", "links", "bank-accounts", "tariffs", "redirects"],
  },
  {
    label: "مدیریت و امنیت",
    icon: Settings2,
    keys: ["contact-messages", "audit-logs", "users", "settings", "security"],
  },
];
export function AdminShell({
  user,
  notifications,
  children,
}: {
  user: User;
  notifications: NotificationData;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await api("/api/v1/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      setError(errorMessage(error));
      setBusy(false);
    }
  }
  function label(key: string) {
    return key === "media"
      ? "کتابخانه رسانه"
      : key === "settings"
        ? "تنظیمات سایت"
        : key === "security"
          ? "امنیت حساب"
          : resources[key]?.label || key;
  }
  function allowed(key: string) {
    return (
      key === "media" ||
      key === "security" ||
      (key === "settings" ? user.role !== "editor" : canAccess(key, user.role))
    );
  }
  const active = (key: string) =>
    path === "/admin/" + key || path.startsWith("/admin/" + key + "/");
  return (
    <div className="admin-app admin-refined">
      <aside className={"admin-sidebar " + (open ? "is-open" : "")}>
        <div className="admin-brand">
          <img src="/assets/logo_kanoon.png" alt="نشان کانون" />
          <div>
            <strong>کانون مازندران</strong>
            <span>میز کار روابط عمومی</span>
          </div>
          <button
            type="button"
            className="sidebar-close"
            aria-label="بستن منو"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <Link
          href="/admin/posts/new?type=news"
          prefetch={false}
          className="sidebar-create"
          onClick={() => setOpen(false)}
        >
          <Plus size={18} />
          ثبت خبر جدید
        </Link>
        <label className="sidebar-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="پیدا کردن ابزار…"
            aria-label="جستجو در ابزارهای داشبورد"
          />
        </label>
        <nav>
          <Link
            href="/admin"
            prefetch={false}
            onClick={() => setOpen(false)}
            className={path === "/admin" ? "active" : ""}
            aria-current={path === "/admin" ? "page" : undefined}
          >
            <LayoutDashboard size={18} />
            میز کار
          </Link>
          {canAccess("pages", user.role) && (
            <Link
              href="/admin/pages/new"
              prefetch={false}
              onClick={() => setOpen(false)}
              className={path === "/admin/pages/new" ? "active" : ""}
              aria-current={path === "/admin/pages/new" ? "page" : undefined}
            >
              <Plus size={18} />
              ساخت صفحه جدید
            </Link>
          )}
          {groups.map((group) => {
            const keys = group.keys.filter(
              (key) => allowed(key) && label(key).includes(query.trim()),
            );
            if (!keys.length) return null;
            const Icon = group.icon;
            return (
              <details
                key={group.label}
                className="sidebar-group"
                open={
                  !!query ||
                  keys.some(active) ||
                  group.label === "محتوا و رسانه"
                }
              >
                <summary>
                  <Icon size={16} />
                  {group.label}
                  <ChevronDown size={14} />
                </summary>
                <div>
                  {keys.map((key) => (
                    <Link
                      key={key}
                      href={"/admin/" + key}
                      prefetch={false}
                      onClick={() => setOpen(false)}
                      className={active(key) ? "active" : ""}
                      aria-current={active(key) ? "page" : undefined}
                    >
                      {key === "media" ? (
                        <ImageIcon size={15} />
                      ) : (
                        <FileText size={15} />
                      )}
                      {label(key)}
                    </Link>
                  ))}
                </div>
              </details>
            );
          })}
        </nav>
        <Link prefetch={false} href="/" className="admin-public-link">
          <ExternalLink size={16} />
          مشاهده وبسایت
        </Link>
      </aside>
      {open && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="بستن منو"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-mobile-menu"
            aria-label="باز کردن منو"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <div className="admin-user">
            <span className="admin-avatar">{user.name.slice(0, 1)}</span>
            <div>
              <strong>{user.name}</strong>
              <small>
                <ShieldCheck size={12} />
                {user.role === "super_admin"
                  ? "مدیر کل"
                  : user.role === "relations_manager"
                    ? "مدیر روابط عمومی"
                    : "نویسنده"}
              </small>
            </div>
          </div>
          <div className="admin-topbar-actions">
            <ThemeToggle />
            <NotificationCenter initial={notifications} />
            <button
              type="button"
              className="admin-logout"
              onClick={() => void logout()}
              disabled={busy}
            >
              <LogOut size={17} />
              <span>{busy ? "در حال خروج…" : "خروج"}</span>
            </button>
          </div>
        </header>
        <main id="main" className="admin-content">
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
