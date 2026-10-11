"use client";

import { number, stripLocale } from "@/lib/i18n";
import {
  isNewsMenu,
  menuSections,
  type MegaSection,
} from "@/lib/navigation-sections";
import { safeHref, text } from "@/lib/shared";
import type { Menu } from "@/lib/types";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  Handshake,
  HeartHandshake,
  History,
  House,
  Images,
  Landmark,
  Link2,
  Network,
  Newspaper,
  Phone,
  Scale,
  Search,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import Link from "./localized-link";

type NavigationVariant = "desktop" | "mobile";

function normalizePath(path: string): string {
  return stripLocale(path).replace(/\/+$/, "") || "/";
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

function visibleChildren(item: Menu): Menu[] {
  return (item.children ?? []).filter(
    (child) => child.url !== "/tariffs/calculator",
  );
}

function branchActive(item: Menu, pathname: string, query: string): boolean {
  if (item.url === "/tariffs/calculator") return false;
  return (
    matchesUrl(safeHref(item.url), pathname, query) ||
    visibleChildren(item).some((child) => branchActive(child, pathname, query))
  );
}

function menuDescription(item: Menu, english: boolean): string {
  const label = text(item.original_title || item.title);
  const descriptions = [
    {
      pattern: /خبر|مقاله|news|article/i,
      fa: "تازه‌ترین خبرها، اطلاعیه‌ها و مقاله‌های کانون",
      en: "Latest news, announcements and articles",
    },
    {
      pattern: /امور کارشناسان|expert services/i,
      fa: "جستجوی کارشناسان و دسترسی به خدمات و سامانه‌ها",
      en: "Find an expert and access services and portals",
    },
    {
      pattern: /قوانین|مقررات|laws|regulations/i,
      fa: "قوانین، نظام‌نامه‌ها و تعرفه‌های کارشناسی",
      en: "Laws, regulations and expert service fees",
    },
    {
      pattern: /درباره|about/i,
      fa: "آشنایی با کانون، اعضا و همکاری‌های آن",
      en: "Discover the council, its members and partnerships",
    },
  ];
  const description = descriptions.find(({ pattern }) => pattern.test(label));
  return description
    ? english
      ? description.en
      : description.fa
    : english
      ? "Choose a section to continue"
      : "بخش مورد نظر خود را انتخاب کنید";
}

function MenuIcon({ item }: { item: Menu }) {
  const value =
    text(item.original_title || item.title) + " " + (item.url || "");
  const rules = [
    [/تماس|ارتباط|contact/i, Phone],
    [/تاریخچه|ادوار|history|former/i, History],
    [/جستجو|search|\/experts(?:[/?#]|$)/i, Search],
    [/گالری|تصاویر|gallery|albums/i, Images],
    [/مصوب|resolution/i, ClipboardList],
    [/رفاه|تسلیت|اجتماعی|welfare|condolence|community/i, HeartHandshake],
    [/خبر|اخبار|اطلاعیه|اطلاع‌رسانی|news|announcement/i, Newspaper],
    [/مقاله|article/i, BookOpen],
    [/رویداد|event/i, CalendarDays],
    [/آموزش|کارآموز|training|karamooz/i, GraduationCap],
    [/تعرفه|دستمزد|tariff/i, WalletCards],
    [/قرارداد|تفاهم|agreement/i, Handshake],
    [/حساب|بانک|bank/i, Landmark],
    [/سامانه|systems/i, Network],
    [/قوانین و مقررات|laws and regulations/i, Scale],
    [/قانون|آیین|نظام|بخشنامه|فرم|documents|regulation/i, FileText],
    [/کارشناس|هیئت|هیت|board|discipline|qualification/i, UsersRound],
    [/درباره|کانون|about|council/i, Building2],
  ] as const;
  const Icon = rules.find(([pattern]) => pattern.test(value))?.[1] || Link2;
  return (
    <Icon className="nav-icon" size={16} strokeWidth={1.8} aria-hidden="true" />
  );
}

function MegaEntry({
  item,
  pathname,
  query,
}: {
  item: Menu;
  pathname: string;
  query: string;
}) {
  const { locale, t } = useLocale();
  const children = visibleChildren(item);
  const href = safeHref(item.url);
  const active = branchActive(item, pathname, query);
  if (!href && !children.length) return null;
  const content = (
    <>
      <span className="mega-link-symbol">
        <MenuIcon item={item} />
      </span>
      <span className="mega-link-label">{t(item.title)}</span>
    </>
  );
  return (
    <li className={children.length ? "mega-subgroup" : undefined}>
      {href ? (
        <Link
          href={href}
          className={"mega-menu-link" + (active ? " is-active" : "")}
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
          data-external={item.open_new_tab ? "true" : undefined}
        >
          {content}
          {item.open_new_tab ? (
            <ArrowUpRight
              className="mega-link-arrow"
              size={14}
              aria-hidden="true"
            />
          ) : locale === "en" ? (
            <ChevronRight
              className="mega-link-arrow"
              size={14}
              aria-hidden="true"
            />
          ) : (
            <ChevronLeft
              className="mega-link-arrow"
              size={14}
              aria-hidden="true"
            />
          )}
        </Link>
      ) : (
        <span className={"mega-subgroup-title" + (active ? " is-active" : "")}>
          {content}
        </span>
      )}
      {children.length > 0 && (
        <ul className="mega-nested-list">
          {children.map((child) => (
            <MegaEntry
              key={child.id}
              item={child}
              pathname={pathname}
              query={query}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function preferredSection(
  sections: MegaSection[],
  pathname: string,
  query: string,
): string {
  let selected = sections[0]?.id || "";
  let score = 0;
  for (const section of sections) {
    const exactLinks = section.items.filter((child) =>
      matchesUrl(safeHref(child.url), pathname, query, true),
    );
    const activeLink = section.items.some((child) =>
      branchActive(child, pathname, query),
    );
    const current = exactLinks.length
      ? 4 +
        Math.max(
          ...exactLinks.map(
            (child) =>
              new URL(child.url!, "https://navigation.local").searchParams.size,
          ),
        ) /
          100
      : activeLink
        ? 3
        : matchesUrl(safeHref(section.source.url), pathname, query, true)
          ? 2
          : branchActive(section.source, pathname, query)
            ? 1
            : 0;
    if (current > score) {
      selected = section.id;
      score = current;
    }
  }
  return selected;
}

function MegaPanel({
  item,
  pathname,
  query,
  id,
  labelledBy,
  onClose,
}: {
  item: Menu;
  pathname: string;
  query: string;
  id: string;
  labelledBy: string;
  onClose: () => void;
}) {
  const { locale, t } = useLocale();
  const sections = useMemo(() => menuSections(item, locale), [item, locale]);
  const scope = pathname + "?" + query;
  const [selection, setSelection] = useState<{
    scope: string;
    id: string;
  } | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected =
    selection?.scope === scope &&
    sections.some((section) => section.id === selection.id)
      ? selection.id
      : preferredSection(sections, pathname, query);
  const categorized = sections.length > 1;
  const href = safeHref(item.url);
  const choose = (sectionId: string) => setSelection({ scope, id: sectionId });
  return (
    <div
      id={id}
      className="mega-menu-panel"
      data-news-menu={isNewsMenu(item) ? "true" : undefined}
      role="region"
      aria-labelledby={labelledBy}
    >
      <div className="mega-menu-heading">
        <span className="mega-menu-identity">
          <span className="mega-menu-symbol">
            <MenuIcon item={item} />
          </span>
          <span className="mega-menu-heading-copy">
            <strong>{t(item.title)}</strong>
            <span className="mega-menu-hint">
              {menuDescription(item, locale === "en")}
            </span>
          </span>
        </span>
        <div className="mega-menu-actions">
          {href && (
            <Link
              href={href}
              prefetch={false}
              className="mega-menu-all"
              target={item.open_new_tab ? "_blank" : undefined}
              rel={item.open_new_tab ? "noopener noreferrer" : undefined}
            >
              {t("مشاهده همه")}
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          )}
          <button
            type="button"
            className="mega-menu-close"
            aria-label={t("بستن منو") + ": " + t(item.title)}
            onClick={onClose}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        className={"mega-workspace" + (categorized ? " has-categories" : "")}
      >
        {categorized && (
          <div className="mega-category-sidebar">
            <span className="mega-category-caption">
              {locale === "en" ? "Browse by category" : "انتخاب دسته‌بندی"}
            </span>
            <div
              className="mega-category-list"
              role="tablist"
              aria-label={t(item.title)}
              aria-orientation="vertical"
            >
              {sections.map((section, position) => {
                const active =
                  section.items.some((child) =>
                    branchActive(child, pathname, query),
                  ) ||
                  matchesUrl(
                    safeHref(section.source.url),
                    pathname,
                    query,
                    true,
                  );
                return (
                  <button
                    ref={(node) => {
                      tabs.current[position] = node;
                    }}
                    key={section.id}
                    id={id + "-tab-" + section.id}
                    type="button"
                    role="tab"
                    className={
                      "mega-category-tab" + (active ? " is-current" : "")
                    }
                    aria-selected={selected === section.id}
                    aria-controls={id + "-" + section.id}
                    tabIndex={selected === section.id ? 0 : -1}
                    onClick={() => choose(section.id)}
                    onFocus={() => choose(section.id)}
                    onPointerEnter={(event) => {
                      if (
                        event.pointerType === "mouse" &&
                        window.matchMedia("(hover: hover)").matches &&
                        !event.currentTarget.parentElement?.querySelector(
                          ":focus-visible",
                        )
                      )
                        choose(section.id);
                    }}
                    onKeyDown={(event) => {
                      let target = position;
                      if (event.key === "ArrowDown")
                        target = (position + 1) % sections.length;
                      else if (event.key === "ArrowUp")
                        target =
                          (position + sections.length - 1) % sections.length;
                      else if (event.key === "Home") target = 0;
                      else if (event.key === "End")
                        target = sections.length - 1;
                      else return;
                      event.preventDefault();
                      choose(sections[target].id);
                      tabs.current[target]?.focus();
                    }}
                  >
                    <span className="mega-category-symbol">
                      <MenuIcon item={section.source} />
                    </span>
                    <span className="mega-category-copy">
                      <span>
                        {section.source === item
                          ? locale === "en"
                            ? "Quick links"
                            : "دسترسی‌های سریع"
                          : t(section.source.title)}
                      </span>
                      <small>
                        {number(section.items.length, locale)}{" "}
                        {locale === "en" ? "links" : "پیوند"}
                      </small>
                    </span>
                    {locale === "en" ? (
                      <ChevronRight size={14} aria-hidden="true" />
                    ) : (
                      <ChevronLeft size={14} aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="mega-content-area">
          {sections.map((section) => {
            const sectionHref =
              section.source === item ? null : safeHref(section.source.url);
            return (
              <section
                key={section.id}
                id={id + "-" + section.id}
                className="mega-category-panel"
                role={categorized ? "tabpanel" : undefined}
                aria-labelledby={
                  categorized ? id + "-tab-" + section.id : labelledBy
                }
                hidden={categorized && selected !== section.id}
              >
                {section.source !== item && (
                  <div className="mega-section-heading">
                    <div>
                      {section.parents.length > 0 && (
                        <span className="mega-section-breadcrumb">
                          {section.parents
                            .map((parent) => t(parent.title))
                            .join(" / ")}
                        </span>
                      )}
                      <h3>{t(section.source.title)}</h3>
                    </div>
                    {sectionHref && (
                      <Link
                        className="mega-section-all"
                        href={sectionHref}
                        prefetch={false}
                        target={
                          section.source.open_new_tab ? "_blank" : undefined
                        }
                        rel={
                          section.source.open_new_tab
                            ? "noopener noreferrer"
                            : undefined
                        }
                      >
                        {t("مشاهده همه")}
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                )}
                <ul className="mega-section-links">
                  {section.items.map((child) => (
                    <MegaEntry
                      key={child.id}
                      item={child}
                      pathname={pathname}
                      query={query}
                    />
                  ))}
                </ul>
                {!section.items.length && (
                  <p className="mega-section-empty">
                    {locale === "en"
                      ? "Open this section to see its content."
                      : "برای مشاهده مطالب، وارد این بخش شوید."}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NavItemView({
  item,
  pathname,
  query,
  variant,
}: {
  item: Menu;
  pathname: string;
  query: string;
  variant: NavigationVariant;
}) {
  const { t } = useLocale();
  const closeTimer = useRef<number | null>(null);
  const dropdown = useRef<HTMLDetailsElement>(null);
  const id = useId();
  const desktop = variant === "desktop";
  useEffect(() => {
    if (!desktop) return;
    const closeOutside = (event: PointerEvent) => {
      if (
        dropdown.current?.open &&
        event.target instanceof Node &&
        !dropdown.current.contains(event.target)
      ) {
        dropdown.current.open = false;
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, [desktop]);
  const closeMenu = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    if (!dropdown.current) return;
    dropdown.current.open = false;
    dropdown.current
      .querySelector<HTMLElement>(":scope > summary")
      ?.focus({ preventScroll: true });
  };
  const children = visibleChildren(item);
  const href = safeHref(item.url);
  const active = branchActive(item, pathname, query);
  if (children.length) {
    return (
      <details
        ref={dropdown}
        name={desktop ? "site-desktop-navigation" : undefined}
        className={
          "nav-dropdown" +
          (desktop ? " nav-mega" : "") +
          (active ? " is-active" : "")
        }
        onPointerEnter={(event) => {
          if (
            desktop &&
            event.pointerType === "mouse" &&
            window.matchMedia("(hover: hover)").matches
          ) {
            if (closeTimer.current !== null)
              window.clearTimeout(closeTimer.current);
            closeTimer.current = null;
            event.currentTarget.open = true;
          }
        }}
        onPointerLeave={(event) => {
          if (
            desktop &&
            event.pointerType === "mouse" &&
            !event.currentTarget.querySelector(":focus-visible")
          ) {
            const dropdown = event.currentTarget;
            if (closeTimer.current !== null)
              window.clearTimeout(closeTimer.current);
            closeTimer.current = window.setTimeout(() => {
              if (
                !dropdown.matches(":hover") &&
                !dropdown.querySelector(":focus-visible")
              )
                dropdown.open = false;
              closeTimer.current = null;
            }, 240);
          }
        }}
        onBlur={(event) => {
          if (
            desktop &&
            !event.currentTarget.contains(event.relatedTarget) &&
            !event.currentTarget.matches(":hover")
          )
            event.currentTarget.open = false;
        }}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a"))
            event.currentTarget.open = false;
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closeMenu();
          }
        }}
      >
        <summary
          id={id + "-trigger"}
          aria-controls={id + "-panel"}
          onClick={(event) => {
            const pointerType =
              "pointerType" in event.nativeEvent
                ? event.nativeEvent.pointerType
                : "";
            if (
              desktop &&
              event.detail > 0 &&
              pointerType !== "touch" &&
              pointerType !== "pen" &&
              window.matchMedia("(hover: hover) and (pointer: fine)").matches
            ) {
              event.preventDefault();
              if (dropdown.current) dropdown.current.open = true;
            }
          }}
          onKeyDown={(event) => {
            if (!desktop || event.key !== "ArrowDown") return;
            event.preventDefault();
            if (!dropdown.current) return;
            dropdown.current.open = true;
            dropdown.current
              .querySelector<HTMLElement>(
                '.mega-category-tab[aria-selected="true"], .mega-menu-link',
              )
              ?.focus();
          }}
        >
          <MenuIcon item={item} />
          <span className="nav-label">{t(item.title)}</span>
          <ChevronDown className="nav-chevron" size={13} aria-hidden="true" />
        </summary>
        {desktop ? (
          <MegaPanel
            item={item}
            pathname={pathname}
            query={query}
            id={id + "-panel"}
            labelledBy={id + "-trigger"}
            onClose={closeMenu}
          />
        ) : (
          <div className="dropdown-panel" id={id + "-panel"}>
            {href && (
              <Link href={href} prefetch={false} className="nav-link">
                {t("مشاهده همه")}
              </Link>
            )}
            {children.map((child) => (
              <NavItemView
                key={child.id}
                item={child}
                pathname={pathname}
                query={query}
                variant="mobile"
              />
            ))}
          </div>
        )}
      </details>
    );
  }
  if (!href || href === "/tariffs/calculator") return null;
  return (
    <Link
      className={"nav-link" + (active ? " is-active" : "")}
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
      <MenuIcon item={item} />
      <span className="nav-label">{t(item.title)}</span>
    </Link>
  );
}

function CurrentNavItem({
  item,
  variant,
}: {
  item: Menu;
  variant: NavigationVariant;
}) {
  const pathname = usePathname();
  const query = useSearchParams();
  return (
    <NavItemView
      item={item}
      pathname={stripLocale(pathname ?? "")}
      query={query.toString()}
      variant={variant}
    />
  );
}

export function NavItem({
  item,
  variant = "mobile",
}: {
  item: Menu;
  variant?: NavigationVariant;
}) {
  return (
    <Suspense
      fallback={
        <NavItemView item={item} pathname="" query="" variant={variant} />
      }
    >
      <CurrentNavItem item={item} variant={variant} />
    </Suspense>
  );
}

function CurrentHomeLink() {
  const pathname = usePathname();
  const { t } = useLocale();
  const active = stripLocale(pathname) === "/";
  return (
    <Link
      prefetch={false}
      className={"nav-link" + (active ? " is-active" : "")}
      href="/"
      aria-current={active ? "page" : undefined}
    >
      <House
        className="nav-icon"
        size={16}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <span className="nav-label">{t("صفحه اصلی")}</span>
    </Link>
  );
}

export function HomeNavLink() {
  const { t } = useLocale();
  return (
    <Suspense
      fallback={
        <Link prefetch={false} className="nav-link" href="/">
          <House
            className="nav-icon"
            size={16}
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <span className="nav-label">{t("صفحه اصلی")}</span>
        </Link>
      }
    >
      <CurrentHomeLink />
    </Suspense>
  );
}
