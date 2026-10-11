import { stripLocale, type Locale } from "./i18n";
import { safeHref } from "./shared";
import type { Menu } from "./types";

export type MegaSection = {
  id: string;
  source: Menu;
  parents: Menu[];
  items: Menu[];
};

type NewsCategory =
  "updates" | "knowledge" | "decisions" | "community" | "other";

const newsCategories: {
  key: NewsCategory;
  fa: string;
  en: string;
}[] = [
  { key: "updates", fa: "اخبار و اطلاع‌رسانی", en: "News and announcements" },
  { key: "knowledge", fa: "مقاله‌ها و آموزش", en: "Articles and training" },
  {
    key: "decisions",
    fa: "مصوبات و بخشنامه‌ها",
    en: "Resolutions and circulars",
  },
  {
    key: "community",
    fa: "اخبار رفاهی و اجتماعی",
    en: "Welfare and community",
  },
  { key: "other", fa: "سایر پیوندها", en: "Other links" },
];

function childrenOf(item: Menu): Menu[] {
  return (item.children ?? []).filter(
    (child) => child.url !== "/tariffs/calculator",
  );
}

function localTarget(item: Menu): URL | null {
  const href = safeHref(item.url);
  return href && /^\/(?!\/)/.test(href)
    ? new URL(href, "https://navigation.local")
    : null;
}

function menuLabel(item: Menu): string {
  return String(item.original_title || item.title)
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک");
}

export function isNewsMenu(item: Menu): boolean {
  const target = localTarget(item);
  const path = target ? stripLocale(target.pathname).replace(/\/+$/, "") : "";
  return (
    path === "/news" ||
    path === "/articles" ||
    /اخبار|مقاله|news|articles?/i.test(menuLabel(item))
  );
}

function newsCategory(item: Menu): NewsCategory {
  const target = localTarget(item);
  const path = target ? stripLocale(target.pathname).replace(/\/+$/, "") : "";
  const type = target?.searchParams.get("type") || "";

  if (path === "/articles" || type === "article" || type === "training")
    return "knowledge";
  if (type === "resolution" || type === "circular") return "decisions";
  if (type === "welfare" || type === "condolence") return "community";
  if (type === "announcement" || type === "group_event" || type === "news")
    return "updates";

  const label = menuLabel(item);
  if (/مقاله|آموزش|article|training|education/i.test(label)) return "knowledge";
  if (/مصوب|بخشنامه|resolution|circular/i.test(label)) return "decisions";
  if (/رفاه|تسلیت|اجتماعی|welfare|condolence|community/i.test(label))
    return "community";
  if (/خبر|اطلاعیه|رویداد|news|announcement|event/i.test(label))
    return "updates";
  if (path === "/news" && !type) return "updates";
  return "other";
}

export function menuSections(item: Menu, locale: Locale = "fa"): MegaSection[] {
  const sections: MegaSection[] = [];
  const visit = (group: Menu, parents: Menu[]) => {
    const children = childrenOf(group);
    const items = children.filter(
      (child) => !childrenOf(child).length && safeHref(child.url),
    );
    if (items.length || (group !== item && safeHref(group.url))) {
      sections.push({
        id: "section-" + group.id,
        source: group,
        parents,
        items,
      });
    }
    for (const child of children.filter((child) => childrenOf(child).length)) {
      visit(child, group === item ? [] : [...parents, group]);
    }
  };
  visit(item, []);

  if (!isNewsMenu(item) || sections.length !== 1 || sections[0].source !== item)
    return sections;

  const buckets = new Map<NewsCategory, Menu[]>();
  for (const child of sections[0].items) {
    const key = newsCategory(child);
    const bucket = buckets.get(key) || [];
    bucket.push(child);
    buckets.set(key, bucket);
  }

  return newsCategories.flatMap((category): MegaSection[] => {
    const items = buckets.get(category.key);
    if (!items?.length) return [];
    return [
      {
        id: "section-news-" + category.key,
        source: {
          ...item,
          title: locale === "en" ? category.en : category.fa,
          original_title: category.fa,
          url: null,
          open_new_tab: false,
          children: items,
        },
        parents: [],
        items,
      },
    ];
  });
}
