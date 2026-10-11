import { stripLocale } from "./i18n";
import type { Menu } from "./types";

type GroupKey = "council" | "regulations" | "experts";

const groupTitles: Record<GroupKey, string> = {
  council: "درباره کانون",
  regulations: "قوانین و مقررات",
  experts: "امور کارشناسان",
};

function normalizedTitle(value: string): string {
  return value
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\s\u200c\u200d]+/g, " ")
    .trim()
    .toLowerCase();
}

function menuPath(item: Menu): string {
  if (!item.url?.startsWith("/")) return "";
  return stripLocale(item.url.split(/[?#]/, 1)[0]).replace(/\/+$/, "") || "/";
}

function visibleMenus(items: Menu[]): Menu[] {
  return items
    .filter(
      (item) => !["/", "/faqs", "/tariffs/calculator"].includes(menuPath(item)),
    )
    .map((item) => ({ ...item, children: visibleMenus(item.children || []) }));
}

function groupKey(item: Menu): GroupKey | null {
  const name = normalizedTitle(String(item.original_title || item.title));
  const path = menuPath(item);

  if (
    [
      "درباره کانون",
      "قراردادها و تفاهم نامه ها",
      "about the council",
      "agreements",
      "contracts and agreements",
    ].includes(name) ||
    path === "/agreements"
  )
    return "council";

  if (
    [
      "قوانین و مقررات",
      "تعرفه دستمزد",
      "laws and regulations",
      "expert fees",
    ].includes(name) ||
    path === "/tariffs"
  )
    return "regulations";

  if (
    [
      "امور کارشناسان",
      "سامانه ها",
      "سامانه کارآموزان",
      "expert services",
      "online systems",
      "trainee portal",
      "trainee system",
    ].includes(name) ||
    path === "/systems" ||
    /^https?:\/\/karamooz\.kkrm\.ir(?:[/?#]|$)/i.test(item.url || "")
  )
    return "experts";

  return null;
}

export function groupedNavigation(items: Menu[]): Menu[] {
  const visible = visibleMenus(items);
  const buckets = new Map<GroupKey, Menu[]>();
  const keys = new Map<Menu, GroupKey>();
  const ids = new Set<number>();
  const collectIds = (nodes: Menu[]) => {
    for (const node of nodes) {
      ids.add(node.id);
      collectIds(node.children);
    }
  };
  collectIds(visible);

  for (const item of visible) {
    const key = groupKey(item);
    if (!key) continue;
    keys.set(item, key);
    const bucket = buckets.get(key) || [];
    bucket.push(item);
    buckets.set(key, bucket);
  }

  const result: Menu[] = [];
  const emitted = new Set<GroupKey>();
  let nextId = -10000;

  for (const item of visible) {
    const key = keys.get(item);
    const members = key ? buckets.get(key) : undefined;
    if (!key || !members || members.length < 2) {
      result.push(item);
      continue;
    }
    if (emitted.has(key)) continue;
    emitted.add(key);

    while (ids.has(nextId)) nextId--;
    const id = nextId--;
    ids.add(id);
    const groupTitle = groupTitles[key];
    const primary =
      members.find(
        (member) =>
          normalizedTitle(String(member.original_title || member.title)) ===
          normalizedTitle(groupTitle),
      ) || members[0];

    result.push({
      ...primary,
      id,
      title: groupTitle,
      original_title: groupTitle,
      url: null,
      parent_id: null,
      open_new_tab: false,
      children: [primary, ...members.filter((member) => member !== primary)],
    });
  }

  return result;
}
