"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname,useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { resources, canAccess } from "@/lib/admin-resources";
import { api } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import type { User } from "@/lib/types";

export function AdminShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
  const nav = [
    { key: "", label: "نمای کلی" },
    ...Object.entries(resources)
      .filter(([key]) => canAccess(key, user.role))
      .map(([key, config]) => ({ key, label: config.label })),
    { key: "media", label: "کتابخانه رسانه" },
    ...(user.role !== "editor"
      ? [{ key: "settings", label: "تنظیمات سایت" }]
      : []),
    { key: "security", label: "امنیت حساب" },
  ];
  return (
    <div className="admin-app">
      <aside className={"admin-sidebar " + (open ? "is-open" : "")}>
        <div className="admin-brand">
          <img src="/assets/fig-44.png" alt="" />
          <div>
            <strong>کانون مازندران</strong>
            <span>داشبورد روابط عمومی</span>
          </div>
          <button
            className="sidebar-close"
            aria-label="بستن منو"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <nav>
          {nav.map(({ key, label }) => {
            const href = "/admin" + (key ? "/" + key : "");
            return (
              <Link
                key={key}
                className={
                  path === href || (key && path.startsWith(href + "/"))
                    ? "active"
                    : ""
                }
                href={href}
                prefetch={false}
                onClick={() => setOpen(false)}
              >
                {key ? (
                  <span className="nav-dot" />
                ) : (
                  <LayoutDashboard size={18} />
                )}
                {label}
              </Link>
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
          className="sidebar-backdrop"
          aria-label="بستن منو"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-mobile-menu"
            aria-label="باز کردن منو"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <div>
            <ShieldCheck size={18} />
            <strong>{user.name}</strong>
            <span>
              {user.role === "super_admin"
                ? "مدیر ارشد"
                : user.role === "relations_manager"
                  ? "مدیر روابط عمومی"
                  : "نویسنده"}
            </span>
          </div>
          <button onClick={logout} disabled={busy}>
            <LogOut size={17} />
            {busy ? "در حال خروج…" : "خروج"}
          </button>
        </header>
        <main id="main" className="admin-content">
          {error && <p className="form-error">{error}</p>}
          {children}
        </main>
      </div>
    </div>
  );
}
