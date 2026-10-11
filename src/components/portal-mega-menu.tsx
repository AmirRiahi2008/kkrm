"use client";

import {
  portalSections,
  branchMatches,
  menuMatches,
  type PortalSection,
} from "@/lib/portal-navigation";
import { safeHref } from "@/lib/shared";
import type { Menu } from "@/lib/types";
import {
  BookOpen,
  Building2,
  ChevronDown,
  ChevronLeft,
  LayoutGrid,
  Link2,
  Phone,
  Scale,
  UsersRound,
  X,
} from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useMemo, useRef } from "react";
import { useLocale } from "./locale-provider";
import Link from "./localized-link";

const icons = {
  news: BookOpen,
  experts: UsersRound,
  council: Building2,
  laws: Scale,
  contact: Phone,
};

function PortalEntry({
  item,
  pathname,
  query,
}: {
  item: Menu;
  pathname: string;
  query: string;
}) {
  const { t } = useLocale();
  const href = safeHref(item.url);
  const active = branchMatches(item, pathname, query);
  const link = href ? (
    <Link
      href={href}
      prefetch={false}
      className={"portal-mega-link" + (active ? " is-active" : "")}
      aria-current={menuMatches(href, pathname, query) ? "location" : undefined}
      target={item.open_new_tab ? "_blank" : undefined}
      rel={item.open_new_tab ? "noopener noreferrer" : undefined}
    >
      <Link2 size={13} aria-hidden="true" />
      <span>{t(item.title)}</span>
      <ChevronLeft size={13} aria-hidden="true" />
    </Link>
  ) : null;
  if (!item.children.length) return link;
  return (
    <details
      className={"portal-mega-subgroup" + (active ? " is-active" : "")}
      open={active || undefined}
    >
      <summary>
        <span>{t(item.title)}</span>
        <ChevronDown size={13} aria-hidden="true" />
      </summary>
      <div>
        {link}
        {item.children.map((child) => (
          <PortalEntry
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

function PortalColumns({
  sections,
  pathname,
  query,
}: {
  sections: PortalSection[];
  pathname: string;
  query: string;
}) {
  const { locale, t } = useLocale();
  return (
    <div className="portal-mega-grid">
      {sections.map((section) => {
        const Icon = icons[section.key];
        const active = section.items.some((item) =>
          branchMatches(item, pathname, query),
        );
        return (
          <section
            className={"portal-mega-column" + (active ? " is-current" : "")}
            key={section.key}
          >
            <h3>
              <span>
                <Icon size={18} aria-hidden="true" />
              </span>
              {locale === "en" ? section.en : t(section.label)}
            </h3>
            <div className="portal-mega-items">
              {section.items.map((item) => (
                <PortalEntry
                  key={item.id}
                  item={item}
                  pathname={pathname}
                  query={query}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function PortalMenuView({
  menus,
  mobile,
  pathname,
  query,
}: {
  menus: Menu[];
  mobile: boolean;
  pathname: string;
  query: string;
}) {
  const { locale, t } = useLocale();
  const id = useId();
  const root = useRef<HTMLDetailsElement>(null);
  const sections = useMemo(() => portalSections(menus), [menus]);
  useEffect(() => {
    if (mobile) return;
    const dismiss = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !root.current?.contains(event.target) &&
        root.current
      )
        root.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && root.current?.open) {
        event.preventDefault();
        root.current.open = false;
        root.current.querySelector<HTMLElement>("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [mobile]);
  if (mobile)
    return (
      <PortalColumns sections={sections} pathname={pathname} query={query} />
    );
  const close = () => {
    if (root.current) root.current.open = false;
  };
  const active = sections.some((section) =>
    section.items.some((item) => branchMatches(item, pathname, query)),
  );
  return (
    <details
      ref={root}
      className={"portal-menu" + (active ? " is-current" : "")}
      onPointerEnter={(event) => {
        if (
          event.pointerType === "mouse" &&
          window.matchMedia("(hover: hover)").matches
        )
          event.currentTarget.open = true;
      }}
      onPointerLeave={(event) => {
        if (
          event.pointerType === "mouse" &&
          !event.currentTarget.contains(document.activeElement)
        )
          event.currentTarget.open = false;
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          close();
      }}
      onClick={(event) => {
        if ((event.target as Element).closest("a")) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close();
          root.current?.querySelector<HTMLElement>("summary")?.focus();
        }
      }}
    >
      <summary
        id={id + "-trigger"}
        aria-controls={id + "-panel"}
        onClick={(event) => {
          if (
            event.detail &&
            window.matchMedia("(hover: hover) and (pointer: fine)").matches
          ) {
            event.preventDefault();
            if (root.current) root.current.open = true;
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (root.current) {
              root.current.open = true;
              root.current
                .querySelector<HTMLElement>(".portal-mega-link")
                ?.focus();
            }
          }
        }}
      >
        <LayoutGrid size={18} aria-hidden="true" />
        <span>{locale === "en" ? "Council sections" : "بخش‌های کانون"}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </summary>
      <div
        className="portal-mega-panel"
        id={id + "-panel"}
        role="region"
        aria-labelledby={id + "-trigger"}
      >
        <div className="portal-mega-heading">
          <div>
            <strong>{t("منوی کانون")}</strong>
            <span>
              {locale === "en"
                ? "All sections, in one place"
                : "دسترسی به همه بخش‌ها در یک نگاه"}
            </span>
          </div>
          <button type="button" aria-label={t("بستن منو")} onClick={close}>
            <X size={18} />
          </button>
        </div>
        <PortalColumns sections={sections} pathname={pathname} query={query} />
      </div>
    </details>
  );
}

function CurrentPortalMenu({
  menus,
  mobile,
}: {
  menus: Menu[];
  mobile: boolean;
}) {
  const pathname = usePathname();
  const query = useSearchParams();
  return (
    <PortalMenuView
      menus={menus}
      mobile={mobile}
      pathname={pathname}
      query={query.toString()}
    />
  );
}

export function PortalMegaMenu({
  menus,
  mobile = false,
}: {
  menus: Menu[];
  mobile?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <PortalMenuView menus={menus} mobile={mobile} pathname="" query="" />
      }
    >
      <CurrentPortalMenu menus={menus} mobile={mobile} />
    </Suspense>
  );
}
