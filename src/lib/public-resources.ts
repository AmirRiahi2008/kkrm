import { documentTypes, postTypes } from "./shared";
import type { SearchParams } from "./types";

export const publicResources: Record<
  string,
  { api: string; label: string; types?: Record<string, string> }
> = {
  news: {
    api: "posts",
    label: "اخبار و اطلاعیه‌ها",
    types: Object.fromEntries(
      Object.entries(postTypes).filter(([key]) => key !== "article"),
    ),
  },
  articles: { api: "posts", label: "مقاله‌ها" },
  documents: {
    api: "documents",
    label: "قوانین و اسناد",
    types: documentTypes,
  },
  albums: {
    api: "albums",
    label: "گالری کانون",
    types: { photo: "تصاویر" },
  },
  events: { api: "events", label: "رویدادهای کانون" },
  pages: { api: "pages", label: "درباره کانون" },
  experts: { api: "experts", label: "جستجوی کارشناس" },
  "expert-groups": {
    api: "expert-groups",
    label: "گروه‌های دوازده‌گانه کارشناسی",
  },
  disciplines: { api: "disciplines", label: "رشته‌های کارشناسی" },
  qualifications: { api: "qualifications", label: "صلاحیت‌های کارشناسی" },
  "board-members": {
    api: "board-members",
    label: "هیئت مدیره، بازرسان و دادستان انتظامی",
  },
  "board-terms": { api: "board-terms", label: "دوره‌های هیئت مدیره" },
  agreements: { api: "agreements", label: "قراردادها و تفاهم‌نامه‌ها" },
  faqs: { api: "faqs", label: "پرسش‌های متداول" },
  "bank-accounts": { api: "bank-accounts", label: "شماره حساب‌های کانون" },
  systems: { api: "links", label: "سامانه‌های الکترونیکی" },
  links: { api: "links", label: "پیوندهای مفید" },
  categories: { api: "categories", label: "دسته‌بندی‌ها" },
  tags: { api: "tags", label: "برچسب‌ها" },
};

export const missingDocumentArchives: Record<string, string> = {
  "qualification-titles": "/qualifications",
  "tariff-description": "/documents?type=tariff",
  "increase-qualification": "/documents?q=" + encodeURIComponent("صلاحیت"),
};

export function pageNumber(value: SearchParams[string]): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) ? Math.min(10000, Math.max(1, page)) : 1;
}

export function publicQuery(params: SearchParams, resource: string) {
  const query = new URLSearchParams();
  const allowed = [
    "q",
    "type",
    "sort",
    "category",
    "tag",
    "from",
    "to",
    "group",
    "role",
    "first_name",
    "last_name",
    "license_number",
    "city",
    "geographical_scope",
    "discipline_id",
    "expert_group_id",
    "board_term_id",
  ];
  for (const key of allowed) {
    const value = params[key];
    if (typeof value !== "string" || !value.trim()) continue;
    const limit = ["q"].includes(key)
      ? 150
      : [
            "first_name",
            "last_name",
            "license_number",
            "city",
            "geographical_scope",
            "group",
            "role",
          ].includes(key)
        ? 100
        : 180;
    const normalized = value.trim().slice(0, limit);
    if (key.endsWith("_id") && !/^[1-9]\d*$/.test(normalized)) continue;
    query.set(key, normalized);
  }
  query.set("page", String(pageNumber(params.page)));
  query.set("per_page", "12");
  if (resource === "articles") query.set("type", "article");
  if (resource === "systems") query.set("group", "systems");
  if (resource === "links" && !query.has("group")) query.set("group", "useful");
  return query;
}
