import { stripLocale } from "./i18n";
import { safeHref, text } from "./shared";
import type { Menu } from "./types";

export const portalCategories = [
  { key: "news", label: "اخبار و مقاله‌ها", en: "News and articles" },
  { key: "experts", label: "امور کارشناسان", en: "Expert services" },
  { key: "council", label: "درباره کانون", en: "About the council" },
  { key: "laws", label: "قوانین و مقررات", en: "Laws and regulations" },
  { key: "contact", label: "تماس با ما", en: "Contact us" },
] as const;

export type PortalCategory = (typeof portalCategories)[number]["key"];
export type PortalSection = (typeof portalCategories)[number] & {
  items: Menu[];
};

export const portalPrimaryLinks: Menu[] = [
  {
    id: -21000,
    title: "رفاهیات",
    url: "/news?type=welfare",
    children: [],
    open_new_tab: false,
  },
  {
    id: -21001,
    title: "تماس با ما",
    url: "/contact",
    children: [],
    open_new_tab: false,
  },
];

function containsLink(items: Menu[], url: string): boolean {
  const target = new URL(url, "https://navigation.local");
  return items.some((item) => {
    const href = safeHref(item.url);
    if (href && /^\/(?!\/)/.test(href)) {
      const candidate = new URL(href, target.origin);
      candidate.searchParams.sort();
      target.searchParams.sort();
      if (
        stripLocale(candidate.pathname).replace(/\/+$/, "") ===
          stripLocale(target.pathname).replace(/\/+$/, "") &&
        candidate.searchParams.toString() === target.searchParams.toString()
      ) {
        return true;
      }
    }
    return containsLink(item.children || [], url);
  });
}

function menuIdentity(item: Menu): string {
  const href = safeHref(item.url);
  if (!href) return "group:" + text(item.original_title || item.title);
  if (!/^\/(?!\/)/.test(href)) return href;
  const target = new URL(href, "https://navigation.local");
  target.searchParams.sort();
  return (
    (stripLocale(target.pathname).replace(/\/+$/, "") || "/") + target.search
  );
}

export function portalMainLinks(menus: Menu[]): Menu[] {
  const configured = menus.filter(
    (item) =>
      ["main", "both"].includes(item.display_mode || "") &&
      safeHref(item.url) &&
      menuIdentity(item) !== "/",
  );
  const configuredTargets = new Set<string>();
  const collect = (items: Menu[]) => {
    for (const item of items) {
      if (item.display_mode) configuredTargets.add(menuIdentity(item));
      collect(item.children);
    }
  };
  collect(menus);
  const seen = new Set<string>();
  return [
    ...configured,
    ...portalPrimaryLinks.filter(
      (item) => !configuredTargets.has(menuIdentity(item)),
    ),
  ].flatMap((item) => {
    const key = menuIdentity(item);
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ ...item, children: [] }];
  });
}

export function portalMobileMenus(header: Menu[], mobile: Menu[]): Menu[] {
  const result = header.map((item) => ({
    ...item,
    children: [...item.children],
  }));
  for (const item of mobile) {
    const index = result.findIndex(
      (entry) => menuIdentity(entry) === menuIdentity(item),
    );
    if (index < 0) result.push(item);
    else
      result[index] = {
        ...result[index],
        ...item,
        children: portalMobileMenus(result[index].children, item.children),
      };
  }
  return result;
}

export function menuMatches(
  href: string | null,
  pathname: string,
  query: string,
): boolean {
  if (!href || !/^\/(?!\/)/.test(href)) return false;
  const target = new URL(href, "https://navigation.local");
  const current = stripLocale(pathname).replace(/\/+$/, "") || "/";
  const path = stripLocale(target.pathname).replace(/\/+$/, "") || "/";
  return (
    (current === path || (path !== "/" && current.startsWith(path + "/"))) &&
    Array.from(target.searchParams).every(([key, value]) =>
      new URLSearchParams(query).getAll(key).includes(value),
    )
  );
}

export function branchMatches(
  item: Menu,
  pathname: string,
  query: string,
): boolean {
  return (
    menuMatches(safeHref(item.url), pathname, query) ||
    item.children.some((child) => branchMatches(child, pathname, query))
  );
}

function category(item: Menu): PortalCategory {
  const label = text(item.original_title || item.title)
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک");
  const href = safeHref(item.url) || "";
  const path = href.startsWith("/")
    ? stripLocale(href.split(/[?#]/, 1)[0])
    : "";
  if (
    /تماس|ارتباط با|contact/i.test(label) ||
    path === "/contact" ||
    path === "/faqs"
  )
    return "contact";
  if (
    /خبر|اخبار|مقاله|گالری|رویداد|رفاه|تسلیت|آموزش|news|article|gallery|event|welfare/i.test(
      label,
    ) ||
    /^\/(news|articles|albums|events)(\/|$)/.test(path)
  )
    return "news";
  if (
    /قانون|قوانین|مقررات|آیین|نظام.?نامه|بخشنامه|تعرفه|دستمزد|law|regulation|statute|tariff/i.test(
      label,
    ) ||
    /^\/(documents|tariffs)(\/|$)/.test(path)
  )
    return "laws";
  if (
    /درباره|تاریخچه|هیئت|هیت|ریاست|ارکان|قرارداد|تفاهم|about|board|agreement/i.test(
      label,
    ) ||
    /^\/(pages|board-members|board-terms|agreements)(\/|$)/.test(path)
  )
    return "council";
  return "experts";
}

const defaults: Record<PortalCategory, [string, string][]> = {
  news: [
    ["اخبار کانون", "/news"],
    ["مقاله‌ها", "/articles"],
    ["اطلاعیه‌های کانون", "/news?type=announcement"],
    ["مصوبات", "/news?type=resolution"],
    ["گالری تصاویر", "/albums"],
  ],
  experts: [
    ["گروه‌های کارشناسی", "/expert-groups"],
    ["رشته‌های کارشناسی", "/disciplines"],
    ["سامانه‌ها", "/systems"],
    ["شماره حساب کانون", "/bank-accounts"],
  ],
  council: [
    ["تاریخچه کانون", "/pages/history"],
    ["هیئت مدیره و ارکان", "/board-members"],
    ["قراردادها و تفاهم‌نامه‌ها", "/agreements"],
  ],
  laws: [
    ["قوانین و اسناد", "/documents"],
    ["قوانین", "/documents?type=law"],
    ["آیین‌نامه‌ها", "/documents?type=regulation"],
    ["نظام‌نامه‌ها", "/documents?type=statute"],
  ],
  contact: [["تماس با ما", "/contact"]],
};

export function portalSections(menus: Menu[]): PortalSection[] {
  const buckets: Record<PortalCategory, Menu[]> = {
    news: [],
    experts: [],
    council: [],
    laws: [],
    contact: [],
  };
  const excluded = new Set([
    "/",
    "/experts",
    "/tariffs/calculator",
    "/fees",
    "/faqs",
  ]);
  const clean = (items: Menu[]): Menu[] =>
    items.flatMap((item) => {
      const href = safeHref(item.url);
      const path = href?.startsWith("/")
        ? stripLocale(href.split(/[?#]/, 1)[0])
        : "";
      const children = clean(item.children || []);
      if (
        item.display_mode === "main" ||
        (excluded.has(path) && !item.display_mode)
      )
        return children;
      return href || children.length ? [{ ...item, children }] : [];
    });
  for (const item of clean(menus)) {
    const key = category(item);
    const sameTitle = portalCategories.find(
      (entry) => entry.key === key,
    )?.label;
    if (
      item.children.length &&
      text(item.original_title || item.title) === sameTitle
    ) {
      buckets[key].push(
        ...(item.url ? [{ ...item, children: [] }] : []),
        ...item.children,
      );
    } else buckets[key].push(item);
  }
  return portalCategories.map((section, position) => {
    let items = buckets[section.key];
    if (!items.length)
      items = defaults[section.key]
        .map(([title, url], index) => ({
          id: -20000 - position * 100 - index,
          title,
          url,
          children: [],
          open_new_tab: false,
        }))
        .filter(
          (fallback) =>
            !menus.some(
              (item) =>
                item.display_mode === "main" &&
                menuIdentity(item) === menuIdentity(fallback),
            ),
        );
    for (const link of portalPrimaryLinks) {
      if (
        category(link) === section.key &&
        link.url &&
        !menus.some(
          (item) =>
            item.display_mode === "main" &&
            menuIdentity(item) === menuIdentity(link),
        ) &&
        !containsLink(items, link.url)
      ) {
        items = [...items, link];
      }
    }
    const seen = new Set<string>();
    items = items.filter((item) => {
      const key =
        item.url && !item.children.length ? item.url : "group:" + item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { ...section, items };
  });
}
