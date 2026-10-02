import type { Entity, Media, Value } from "./types";

export const EXPERT_LOGIN = "https://my.kkrm.ir/login/new-login";

export const DEFAULT_PERSON_IMAGE = "/assets/default-person.png";

export function isPersonResource(resource: string): boolean {
  return ["experts", "board-members"].includes(resource);
}

export const postTypes: Record<string, string> = {
  news: "اخبار کانون",
  article: "مقاله‌ها",
  announcement: "اطلاعیه‌ها",
  resolution: "مصوبات",
  training: "آموزش",
  welfare: "اخبار رفاهی",
  condolence: "پیام‌های تسلیت",
  group_event: "رویدادهای گروه‌ها",
};

export const documentTypes: Record<string, string> = {
  law: "قوانین",
  regulation: "آیین‌نامه‌ها",
  statute: "نظام‌نامه‌ها",
  directive: "دستورالعمل‌ها",
  circular: "بخشنامه‌ها",
  form: "فرم‌ها",
  qualification_table: "جدول صلاحیت‌ها",
  tariff: "تعرفه دستمزد",
};

export const statusLabels: Record<string, string> = {
  draft: "پیش‌نویس",
  review: "در انتظار بررسی",
  published: "منتشرشده",
  archived: "بایگانی",
  active: "فعال",
  inactive: "غیرفعال",
  suspended: "تعلیق",
  new: "جدید",
  read: "خوانده‌شده",
  closed: "بسته",
};

export function text(value: Value): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

export function title(item: Entity): string {
  return (
    text(
      item.title ||
        item.name ||
        item.question ||
        item.subject ||
        item.bank_name,
    ) || [text(item.first_name), text(item.last_name)].join(" ").trim()
  );
}

export function faNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}

export function date(value: Value, full = false): string {
  const parsed = new Date(text(value));

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: full ? "long" : "2-digit",
    day: "numeric",
    ...(full ? { weekday: "long" as const } : {}),
  }).format(parsed);
}

export function safeHref(value: Value): string | null {
  const url = text(value).trim();

  if (/^\/(?!\/)/.test(url) && !/[\\\u0000-\u001f]/.test(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);

    return ["https:", "http:"].includes(parsed.protocol) &&
      !parsed.username &&
      !parsed.password
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

export function mediaUrl(
  value: Value | Media,
  fallback = "",
): string {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "id" in value &&
    typeof value.id === "number" &&
    Number.isSafeInteger(value.id) &&
    value.id > 0
  ) {
    return `/backend/api/v1/media/${value.id}`;
  }

  return fallback;
}

export function mediaOf(value: Value | Media): Media | null {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "id" in value &&
    typeof value.id === "number" &&
    Number.isSafeInteger(value.id) &&
    value.id > 0
    ? (value as unknown as Media)
    : null;
}

export function entityPath(resource: string, item: Entity): string {
  if (resource === "news" && item.type === "article") {
    resource = "articles";
  }

  return (
    "/" +
    resource +
    "/" +
    encodeURIComponent(text(item.slug) || String(item.id))
  );
}