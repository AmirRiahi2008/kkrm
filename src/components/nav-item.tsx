"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ChevronDown } from "lucide-react";
import { safeHref } from "@/lib/shared";
import type { Menu } from "@/lib/types";

function normalizePath(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

function matchesUrl(
  href: string | null,
  pathname: string,
  query: string,
  exact = false,
): boolean {
  if (!pathname || !href || !/^\/(?!\/)/.test(href)) return false;

  const target = new URL(href, "https://navigation.local");
  const currentPath = normalizePath(pathname);
  const targetPath = normalizePath(target.pathname);
  const pathMatches =
    currentPath === targetPath ||
    (!exact && targetPath !== "/" && currentPath.startsWith(targetPath + "/"));

  if (!pathMatches) return false;

  const currentQuery = new URLSearchParams(query);

  return Array.from(target.searchParams.entries()).every(([key, value]) =>
    currentQuery.getAll(key).includes(value),
  );
}

function branchActive(item: Menu, pathname: string, query: string): boolean {
  if (item.url === "/tariffs/calculator") return false;

  return (
    matchesUrl(safeHref(item.url), pathname, query) ||
    (item.children ?? []).some((child) => branchActive(child, pathname, query))
  );
}

function NavItemView({
  item,
  pathname,
  query,
}: {
  item: Menu;
  pathname: string;
  query: string;
}) {
  const children = (item.children ?? []).filter(
    (child) => child.url !== "/tariffs/calculator",
  );
  const href = safeHref(item.url);
  const active = branchActive(item, pathname, query);

  if (children.length) {
    return (
      <details
        className={`nav-dropdown${active ? " is-active" : ""}`}
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
            <NavItemView
              key={child.id}
              item={child}
              pathname={pathname}
              query={query}
            />
          ))}
        </div>
      </details>
    );
  }

  if (!href || href === "/tariffs/calculator") return null;

  return (
    <Link
      className={`nav-link${active ? " is-active" : ""}`}
      href={href}
      prefetch={false}
      aria-current={
        active
          ? matchesUrl(href, pathname, query, true)
            ? "page"
            : "location"
          : undefined
      }
      target={item.open_new_tab ? "_blank" : undefined}
      rel={item.open_new_tab ? "noopener noreferrer" : undefined}
    >
      {item.title}
    </Link>
  );
}

function CurrentNavItem({ item }: { item: Menu }) {
  const pathname = usePathname();
  const query = useSearchParams();

  return (
    <NavItemView
      item={item}
      pathname={pathname ?? ""}
      query={query.toString()}
    />
  );
}

export function NavItem({ item }: { item: Menu }) {
  return (
    <Suspense fallback={<NavItemView item={item} pathname="" query="" />}>
      <CurrentNavItem item={item} />
    </Suspense>
  );
}

function CurrentHomeLink() {
  const pathname = usePathname();
  const active = pathname === "/";

  return (
    <Link
      prefetch={false}
      className={`nav-link${active ? " is-active" : ""}`}
      href="/"
      aria-current={active ? "page" : undefined}
    >
      صفحه اصلی
    </Link>
  );
}

export function HomeNavLink() {
  return (
    <Suspense
      fallback={
        <Link prefetch={false} className="nav-link" href="/">
          صفحه اصلی
        </Link>
      }
    >
      <CurrentHomeLink />
    </Suspense>
  );
}
