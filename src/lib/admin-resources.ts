import { documentTypes, postTypes, statusLabels } from "./shared";

export type FieldType =
  | "text"
  | "textarea"
  | "editor"
  | "select"
  | "ref"
  | "multi"
  | "media"
  | "boolean"
  | "number"
  | "date"
  | "datetime"
  | "email"
  | "password"
  | "rules";
export interface Field {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  source?: string;
  options?: Record<string, string>;
  accept?: string;
  hint?: string;
}
export interface Resource {
  label: string;
  fields: Field[];
  readOnly?: boolean;
  noCreate?: boolean;
  noDelete?: boolean;
  noTrash?: boolean;
}
const f = (
  key: string,
  label: string,
  type: FieldType = "text",
  required = false,
): Field => ({ key, label, type, required });
const choice = (
  key: string,
  label: string,
  options: Record<string, string>,
  required = false,
): Field => ({ key, label, type: "select", options, required });
const ref = (
  key: string,
  label: string,
  source: string,
  required = false,
  multi = false,
): Field => ({ key, label, source, required, type: multi ? "multi" : "ref" });
const image = (key = "cover_id", label = "تصویر شاخص"): Field => ({
  key,
  label,
  type: "media",
  accept: "image/*",
});
const file = (key = "file_id", label = "فایل پیوست"): Field => ({
  key,
  label,
  type: "media",
  accept: "image/jpeg,image/png,image/webp,application/pdf",
});
const active = [
  f("is_active", "فعال", "boolean"),
  f("sort_order", "ترتیب نمایش", "number"),
];
const seo = [
  f("meta_title", "عنوان سئو"),
  f("meta_description", "توضیح سئو", "textarea"),
];
const published = [
  choice("status", "وضعیت", {
    draft: "پیش‌نویس",
    published: "منتشرشده",
    archived: "بایگانی",
  }),
  f("published_at", "زمان انتشار", "datetime"),
];
const titleSlug = [
  f("title", "عنوان", "text", true),
  f("slug", "نشانی مطلب", "text", true),
];
export const resources: Record<string, Resource> = {
  posts: {
    label: "اخبار، مقاله‌ها و اطلاعیه‌ها",
    fields: [
      ...titleSlug,
      choice("type", "نوع مطلب", postTypes, true),
      f("excerpt", "خلاصه", "textarea"),
      f("body", "متن مطلب", "editor", true),
      image(),
      ref("category_id", "دسته‌بندی", "categories"),
      ref("tag_ids", "برچسب‌ها", "tags", false, true),
      { ...ref("attachment_ids", "پیوست‌ها", "media", false, true) },
      choice(
        "status",
        "وضعیت",
        Object.fromEntries(
          ["draft", "review", "published", "archived"].map((key) => [
            key,
            statusLabels[key],
          ]),
        ),
      ),
      f("published_at", "زمان انتشار", "datetime"),
      f("expires_at", "زمان پایان نمایش", "datetime"),
      f("is_featured", "خبر برگزیده", "boolean"),
      f("is_pinned", "سنجاق‌شده", "boolean"),
      ...seo,
    ],
  },
  categories: {
    label: "دسته‌بندی‌ها",
    fields: [
      f("name", "نام", "text", true),
      f("slug", "نشانی", "text", true),
      ref("parent_id", "دسته مادر", "categories"),
      ...active,
    ],
  },
  tags: {
    label: "برچسب‌ها",
    fields: [f("name", "نام", "text", true), f("slug", "نشانی", "text", true)],
  },
  pages: {
    label: "صفحات کانون",
    fields: [
      ...titleSlug,
      f("body", "متن صفحه", "editor", true),
      image(),
      ...published,
      ...seo,
    ],
  },
  documents: {
    label: "قوانین و اسناد",
    fields: [
      ...titleSlug,
      choice("type", "نوع سند", documentTypes, true),
      f("description", "توضیح", "textarea"),
      f("body", "متن سند", "editor"),
      file(),
      f("source_url", "نشانی منبع"),
      f("document_number", "شماره سند"),
      f("issued_at", "تاریخ صدور", "date"),
      f("is_demo", "داده آزمایشی", "boolean"),
      ...published,
      ...seo,
    ],
  },
  "expert-groups": {
    label: "گروه‌های کارشناسی",
    fields: [
      f("name", "نام گروه", "text", true),
      f("slug", "نشانی", "text", true),
      f("code", "کد گروه", "text", true),
      f("description", "توضیح", "textarea"),
      ...active,
    ],
  },
  disciplines: {
    label: "رشته‌های کارشناسی",
    fields: [
      ref("expert_group_id", "گروه", "expert-groups", true),
      f("name", "نام رشته", "text", true),
      f("code", "کد رشته", "text", true),
      ...active,
    ],
  },
  qualifications: {
    label: "صلاحیت‌ها",
    fields: [
      ref("discipline_id", "رشته", "disciplines", true),
      f("title", "عنوان صلاحیت", "text", true),
      f("code", "کد صلاحیت", "text", true),
      f("description", "توضیح", "textarea"),
      ...active,
    ],
  },
  experts: {
    label: "کارشناسان",
    fields: [
      ref("discipline_id", "رشته", "disciplines", true),
      f("first_name", "نام", "text", true),
      f("last_name", "نام خانوادگی", "text", true),
      f("license_number", "شماره پروانه", "text", true),
      f("city", "شهر", "text", true),
      f("geographical_scope", "حوزه جغرافیایی", "text", true),
      f("biography", "زندگینامه", "textarea"),
      image("photo_id", "تصویر کارشناس"),
      f("phone", "تلفن"),
      f("email", "ایمیل", "email"),
      f("show_contact", "نمایش عمومی اطلاعات تماس", "boolean"),
      f("is_published", "نمایش در سایت", "boolean"),
      choice("status", "وضعیت", {
        active: "فعال",
        inactive: "غیرفعال",
        suspended: "تعلیق",
      }),
      ref("qualification_ids", "صلاحیت‌ها", "qualifications", false, true),
    ],
  },
  
  "board-members": {
    label: "اعضای هیئت و ارکان",
    fields: [
      
      f("name", "نام", "text", true),
      f("position", "سمت", "text", true),
      f("contact_label", "عنوان راه ارتباطی"),
f("contact_url", "لینک راه ارتباطی"),   
      choice(
        "role",
        "رکن",
        {
          board: "هیئت مدیره",
          inspector: "بازرسان",
          prosecutor: "دادستان انتظامی",
          former_president: "رؤسای پیشین",
        },
        true,
      ),
      image("photo_id", "تصویر"),
      f("biography", "معرفی", "textarea"),
      ...active,
    ],
  },
  agreements: {
    label: "قراردادها و تفاهم‌نامه‌ها",
    fields: [
      ...titleSlug,
      f("partner", "طرف قرارداد", "text", true),
      f("body", "متن", "editor", true),
      file(),
      image(),
      f("starts_at", "شروع", "date"),
      f("ends_at", "پایان", "date"),
      f("is_demo", "داده آزمایشی", "boolean"),
      ...published,
    ],
  },
  albums: {
    label: "آلبوم‌ها",
    fields: [
      ...titleSlug,
      choice("type", "نوع آلبوم", { photo: "عکس" }),
      f("description", "توضیح", "textarea"),
      image(),
      f("event_date", "تاریخ رویداد", "date"),
      ...published,
    ],
  },
  events: {
    label: "رویدادها",
    fields: [
      ...titleSlug,
      f("body", "متن رویداد", "editor", true),
      image(),
      choice(
        "mode",
        "نوع برگزاری",
        { in_person: "حضوری", online: "مجازی", hybrid: "ترکیبی" },
        true,
      ),
      f("location", "محل برگزاری"),
      f("starts_at", "زمان شروع", "datetime", true),
      f("ends_at", "زمان پایان", "datetime", true),
      f("registration_url", "نشانی سامانه رویداد"),
      ...published,
      ...seo,
    ],
  },
  faqs: {
    label: "پرسش‌های متداول",
    fields: [
      f("question", "پرسش", "text", true),
      f("answer", "پاسخ", "editor", true),
      f("group", "گروه"),
      ...active,
    ],
  },
  slides: {
    label: "اسلایدر صفحه اول",
    fields: [
      f("title", "عنوان", "text", true),
      { ...image("image_id", "تصویر"), required: true },
      f("target_url", "لینک مقصد"),
      f("starts_at", "شروع نمایش", "datetime"),
      f("ends_at", "پایان نمایش", "datetime"),
      ...active,
    ],
  },
  links: {
    label: "سامانه‌ها و پیوندها",
    fields: [
      f("title", "عنوان", "text", true),
      f("code", "کد", "text", true),
      f("url", "نشانی", "text", true),
      choice(
        "group",
        "گروه",
        {
          systems: "سامانه‌ها",
          useful: "پیوندهای مفید",
          quick: "سریع",
          social: "شبکه‌های اجتماعی",
        },
        true,
      ),
      f("icon", "آیکون"),
      ...active,
    ],
  },
  "menu-items": {
    label: "منوهای سایت",
    fields: [
      f("title", "عنوان", "text", true),
      choice(
        "location",
        "محل منو",
        {
          header: "هدر",
          footer: "فوتر",
          mobile: "موبایل",
          quick: "دسترسی سریع",
        },
        true,
      ),
      f("url", "مسیر مقصد"),
      ref("parent_id", "منوی مادر", "menu-items"),
      f("open_new_tab", "باز شدن در تب جدید", "boolean"),
      ...active,
    ],
  },
  "bank-accounts": {
    label: "حساب‌های بانکی",
    fields: [
      f("bank_name", "بانک", "text", true),
      f("holder", "صاحب حساب", "text", true),
      f("purpose", "کاربرد", "text", true),
      f("account_number", "شماره حساب", "text", true),
      f("iban", "شبا"),
      f("card_number", "شماره کارت"),
      f("is_demo", "حساب آزمایشی", "boolean"),
      ...active,
    ],
  },
  tariffs: {
    label: "تعرفه‌ها",
    fields: [
      f("name", "نام", "text", true),
      f("slug", "نشانی", "text", true),
      f("effective_from", "تاریخ اجرا", "date", true),
      f("effective_to", "پایان اعتبار", "date"),
      f("source_url", "منبع"),
      f("approval_reference", "مرجع تصویب"),
      f("is_demo", "تعرفه آزمایشی", "boolean"),
      f("rules", "ضرایب تعرفه", "rules", true),
      ...active,
    ],
  },
  redirects: {
    label: "نشانی‌های قدیمی",
    fields: [
      f("old_path", "مسیر قدیمی", "text", true),
      f("new_path", "مسیر جدید", "text", true),
      choice("status_code", "نوع انتقال", {
        "301": "دائمی ۳۰۱",
        "308": "دائمی ۳۰۸",
      }),
      ...active,
    ],
  },
  users: {
    label: "کاربران داشبورد",
    noDelete: true,
    noTrash: true,
    fields: [
      f("name", "نام", "text", true),
      f("email", "ایمیل", "email", true),
      choice(
        "role",
        "نقش",
        {
          super_admin: "مدیر ارشد",
          relations_manager: "مدیر روابط عمومی",
          editor: "نویسنده",
        },
        true,
      ),
      f("password", "رمز عبور", "password"),
      f("password_confirmation", "تکرار رمز", "password"),
      f("is_active", "فعال", "boolean"),
    ],
  },
  "contact-messages": {
    label: "پیام‌های دریافتی",
    noCreate: true,
    noTrash: true,
    fields: [
      choice("status", "وضعیت", {
        new: "جدید",
        read: "خوانده‌شده",
        closed: "بسته",
      }),
      f("internal_note", "یادداشت داخلی", "textarea"),
    ],
  },
  "audit-logs": {
    label: "گزارش فعالیت‌ها",
    readOnly: true,
    noTrash: true,
    fields: [],
  },
};
export function canAccess(resource: string, role: string) {
  if (resource === "security") return true;
  if (resource === "users") return role === "super_admin";
  if (role === "editor") return resource === "posts" || resource === "media";
  return (
    Boolean(resources[resource]) ||
    ["media", "settings", "security"].includes(resource)
  );
}
