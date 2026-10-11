import { text, title } from "./shared";
import type { Entity, Value } from "./types";

export const menuDestinations = [
  {
    key: "main",
    label: "ناوبری اصلی",
    description: "بالای سایت، کنار صفحه اصلی و بیرون از مگامنو",
    location: "header",
    mode: "main",
  },
  {
    key: "mega",
    label: "داخل مگامنو",
    description: "داخل منوی بازشونده بخش‌های کانون",
    location: "header",
    mode: "mega",
  },
  {
    key: "both",
    label: "ناوبری اصلی و مگامنو",
    description: "یک لینک با نمایش هم‌زمان در هر دو محل",
    location: "header",
    mode: "both",
  },
  {
    key: "footer",
    label: "پایین سایت (فوتر)",
    description: "در فهرست لینک‌های پایین تمام صفحات",
    location: "footer",
    mode: "mega",
  },
  {
    key: "mobile",
    label: "منوی اختصاصی موبایل",
    description: "داخل منوی بازشونده موبایل و تبلت",
    location: "mobile",
    mode: "mega",
  },
  {
    key: "quick",
    label: "دسترسی سریع",
    description: "در منوی دسترسی سریع بالای سایت",
    location: "quick",
    mode: "mega",
  },
] as const;

export type MenuDestination = (typeof menuDestinations)[number]["key"];

export function selectedMenuDestination(
  values: Record<string, Value>,
): MenuDestination {
  if (values.location === "header") {
    if (
      values.display_mode == null &&
      !values.parent_id &&
      ["/contact", "/news?type=welfare"].includes(text(values.url))
    )
      return "both";
    return values.display_mode === "main" || values.display_mode === "both"
      ? values.display_mode
      : "mega";
  }
  return (
    menuDestinations.find((item) => item.location === values.location)?.key ||
    "main"
  );
}

export function menuPlacementLabel(item: Entity): string {
  const destination = menuDestinations.find(
    (entry) => entry.key === selectedMenuDestination(item),
  );
  return destination?.label || "ناوبری اصلی";
}

export function menuParentChoices(
  items: Entity[],
  location: string,
  currentId?: number,
) {
  const available = items.filter(
    (item) => item.location === location && !item.deleted_at,
  );
  const byId = new Map(available.map((item) => [item.id, item]));
  const path = (item: Entity): Entity[] | null => {
    const ancestors: Entity[] = [];
    const visited = new Set<number>();
    let current: Entity | undefined = item;
    while (current) {
      if (visited.has(current.id) || current.id === currentId) return null;
      visited.add(current.id);
      ancestors.unshift(current);
      if (!current.parent_id) return ancestors;
      current = byId.get(Number(current.parent_id));
      if (!current) return null;
    }
    return ancestors;
  };
  const branchDepth = (id: number, visited = new Set<number>()): number => {
    if (visited.has(id)) return 4;
    const next = new Set(visited).add(id);
    const children = available.filter((item) => Number(item.parent_id) === id);
    return children.length
      ? 1 + Math.max(...children.map((item) => branchDepth(item.id, next)))
      : 0;
  };
  const existingDepth = currentId ? branchDepth(currentId) : 0;
  return available
    .flatMap((item) => {
      const ancestors = path(item);
      if (
        !ancestors ||
        ancestors.length + existingDepth > 3 ||
        (location === "header" && item.display_mode === "main")
      )
        return [];
      return [
        {
          id: item.id,
          label: ancestors.map((ancestor) => title(ancestor)).join(" ← "),
          inactive: ancestors.some((ancestor) => ancestor.is_active === false),
        },
      ];
    })
    .sort((a, b) => a.label.localeCompare(b.label, "fa") || a.id - b.id);
}

export function menuPlacementPreview(
  values: Record<string, Value>,
  parents: Entity[],
): string {
  const prefix = menuPlacementLabel({ id: 0, ...values });
  const byId = new Map(parents.map((item) => [item.id, item]));
  const names: string[] = [];
  const visited = new Set<number>();
  let parent =
    values.location === "footer"
      ? undefined
      : byId.get(Number(values.parent_id));
  while (parent && !visited.has(parent.id) && names.length < 4) {
    visited.add(parent.id);
    names.unshift(title(parent));
    parent = byId.get(Number(parent.parent_id));
  }
  return [
    prefix,
    names.join(" ← "),
    text(values.title).trim() || "عنوان لینک شما",
  ]
    .filter(Boolean)
    .join(" ← ");
}
