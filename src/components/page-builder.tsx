"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, Eye, FilePlus2, Globe2, Link2, Save } from "lucide-react";
import { api } from "@/lib/api-client";
import { normalizeAdminDate } from "@/lib/admin-date";
import { ApiError, errorMessage } from "@/lib/errors";
import { entityPath, text } from "@/lib/shared";
import type { Entity, Value } from "@/lib/types";
import { RichEditor } from "./rich-editor";
import { JalaliDateField } from "./jalali-date-field";
import { MediaPicker } from "./media-picker";
import "@/app/page-builder.css";

function pageValues(item: Entity | null) {
  return {
    title: text(item?.title),
    path: text(item?.path),
    summary: text(item?.summary),
    body: text(item?.body),
    status: text(item?.status) || "draft",
    published_at: normalizeAdminDate(item?.published_at, true),
    meta_title: text(item?.meta_title),
    meta_description: text(item?.meta_description),
    cover_id: Number(item?.cover_id) || null,
    show_in_slideshow: Boolean(item?.show_in_slideshow),
  };
}

function englishValues(item: Entity | null): Record<string, Value> {
  const translations = item?.translations;
  if (
    !translations ||
    typeof translations !== "object" ||
    Array.isArray(translations)
  )
    return {};
  const english = translations.en;
  return english && typeof english === "object" && !Array.isArray(english)
    ? english
    : {};
}

function suggestedPath(value: string) {
  const slug = value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
  return slug ? "/" + slug : "";
}

export function PageBuilder({
  initial,
  media,
  saved = false,
}: {
  initial: Entity | null;
  media: Entity[];
  saved?: boolean;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const intent = useRef<"save" | "preview">("save");
  const [record, setRecord] = useState(initial);
  const [values, setValues] = useState(() => pageValues(initial));
  const [english, setEnglish] = useState(() => englishValues(initial));
  const [automaticPath, setAutomaticPath] = useState(!initial);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    saved
      ? "صفحه با موفقیت ذخیره شد. اکنون می‌توانید لینک آن را به منو اضافه کنید."
      : "",
  );
  const [copied, setCopied] = useState(false);
  const savedPath = record ? entityPath("pages", record) : "";

  function change<K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === "title" && automaticPath
        ? { path: suggestedPath(String(value)) }
        : {}),
    }));
    setErrors((current) => ({ ...current, [key]: [] }));
    setSuccess("");
  }

  function fieldErrors(key: string) {
    return errors[key]?.map((message) => (
      <span className="field-error" key={message}>
        {message}
      </span>
    ));
  }

  function changeEnglish(key: string, value: string) {
    setEnglish((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, ["translations.en." + key]: [] }));
    setSuccess("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const destination = intent.current;
    intent.current = "save";
    setBusy(true);
    setError("");
    setSuccess("");
    setErrors({});
    const payload = {
      ...values,
      path: values.path.trim() || null,
      summary: values.summary.trim() || null,
      published_at: values.published_at || null,
      meta_title: values.meta_title.trim() || null,
      meta_description: values.meta_description.trim() || null,
      translations: { en: english },
    };
    try {
      const { data } = await api<Entity>(
        "/api/v1/admin/pages" + (record ? "/" + record.id : ""),
        {
          method: record ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setRecord(data);
      setValues(pageValues(data));
      setEnglish(englishValues(data));
      setCopied(false);
      setSuccess(
        "صفحه با موفقیت ذخیره شد. لینک آن برای استفاده در منو آماده است.",
      );
      if (destination === "preview")
        router.push("/admin/pages/" + data.id + "/preview");
      else if (!record) router.replace("/admin/pages/" + data.id + "?saved=1");
      router.refresh();
    } catch (exception) {
      setError(errorMessage(exception));
      if (exception instanceof ApiError) setErrors(exception.errors);
    } finally {
      setBusy(false);
    }
  }

  async function copyPath() {
    if (!savedPath) return;
    const url = new URL(savedPath, window.location.origin).href;
    try {
      if (navigator.clipboard && window.isSecureContext)
        await navigator.clipboard.writeText(url);
      else window.prompt("لینک صفحه را کپی کنید:", url);
      setCopied(true);
    } catch {
      setError("کپی لینک انجام نشد. نشانی صفحه را از کادر زیر کپی کنید.");
    }
  }

  return (
    <div className="page-builder">
      <header className="page-builder-heading">
        <div>
          <span className="page-builder-eyebrow">
            <FilePlus2 size={16} />
            صفحه‌ساز کانون
          </span>
          <h1>{record ? "ویرایش صفحه" : "ساخت صفحه جدید"}</h1>
          <p>
            عنوان و محتوای صفحه را بنویسید؛ هدر، فوتر و چیدمان را قالب سایت
            مدیریت می‌کند.
          </p>
        </div>
        <Link href="/admin/pages" prefetch={false} className="secondary-button">
          فهرست صفحات
        </Link>
      </header>
      {success && (
        <p role="status" className="page-builder-success">
          <Check size={18} />
          {success}
        </p>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <form ref={form} onSubmit={submit} className="page-builder-grid">
        <div className="page-builder-main" inert={busy}>
          <section className="admin-panel page-builder-section">
            <div className="page-builder-section-heading">
              <span>۱</span>
              <div>
                <h2>معرفی صفحه</h2>
                <p>نام، نشانی و توضیحی که بازدیدکننده می‌بیند.</p>
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="page-title">
                عنوان صفحه <span className="required-mark">*</span>
              </label>
              <input
                id="page-title"
                value={values.title}
                required
                maxLength={250}
                onChange={(event) => change("title", event.target.value)}
                placeholder="مثلاً خدمات مشاوره کارشناسی"
                aria-invalid={!!errors.title?.length}
              />
              {fieldErrors("title")}
            </div>
            <div className="form-field">
              <label htmlFor="page-path">
                نشانی دلخواه صفحه{" "}
                {!record && <span className="required-mark">*</span>}
              </label>
              <div className="page-builder-path">
                <Globe2 size={18} />
                <input
                  id="page-path"
                  dir="ltr"
                  value={values.path}
                  required={!record}
                  maxLength={240}
                  placeholder="/services/consultation"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(event) => {
                    setAutomaticPath(false);
                    change("path", event.target.value);
                  }}
                  aria-describedby="page-path-hint"
                  aria-invalid={!!errors.path?.length}
                />
              </div>
              <span className="field-hint" id="page-path-hint">
                فقط مسیر داخل سایت؛ فارسی یا انگلیسی، با خط تیره و بدون فاصله.
                مثال: /services/consultation. مسیرهای اصلی مانند /news و /admin
                رزرو هستند.
              </span>
              {record && !record.path && (
                <span className="field-hint">
                  نشانی فعلی: <bdi>{savedPath}</bdi>. برای حفظ نشانی فعلی، این
                  ورودی را خالی بگذارید.
                </span>
              )}
              {fieldErrors("path")}
            </div>
            <div className="form-field">
              <label htmlFor="page-summary">
                معرفی کوتاه <span className="quiet">اختیاری</span>
              </label>
              <textarea
                id="page-summary"
                rows={3}
                maxLength={500}
                value={values.summary}
                onChange={(event) => change("summary", event.target.value)}
                placeholder="توضیح کوتاهی که زیر عنوان صفحه قرار می‌گیرد…"
              />
              {fieldErrors("summary")}
            </div>
          </section>
          <section className="admin-panel page-builder-section">
            <div className="page-builder-section-heading">
              <span>۲</span>
              <div>
                <h2>محتوای صفحه</h2>
                <p>
                  متن، تصویر، جدول، آلبوم و لینک دریافت فایل را در همین ویرایشگر
                  قرار دهید.
                </p>
              </div>
            </div>
            <RichEditor
              value={values.body}
              onChange={(html) => change("body", html)}
            />
            {fieldErrors("body")}
          </section>
          <details className="admin-panel page-builder-section page-builder-english">
            <summary>نسخه انگلیسی صفحه · English</summary>
            <p className="field-hint">
              ترجمه اختیاری است. صفحه در نسخه انگلیسی سایت هم با همان نشانی و
              پیشوند /en نمایش داده می‌شود.
            </p>
            {(
              [
                ["title", "عنوان"],
                ["summary", "معرفی کوتاه"],
                ["body", "محتوا"],
              ] as const
            ).map(([key, label]) => (
              <div className="form-field" key={key}>
                <label htmlFor={"page-english-" + key}>{label} · انگلیسی</label>
                <div dir="ltr">
                  {key === "body" ? (
                    <RichEditor
                      value={text(english.body)}
                      onChange={(html) => changeEnglish("body", html)}
                    />
                  ) : key === "summary" ? (
                    <textarea
                      id={"page-english-" + key}
                      rows={3}
                      value={text(english[key])}
                      maxLength={500}
                      onChange={(event) =>
                        changeEnglish(key, event.target.value)
                      }
                    />
                  ) : (
                    <input
                      id={"page-english-" + key}
                      value={text(english[key])}
                      maxLength={250}
                      onChange={(event) =>
                        changeEnglish(key, event.target.value)
                      }
                    />
                  )}
                </div>
                {fieldErrors("translations.en." + key)}
              </div>
            ))}
          </details>
        </div>
        <aside className="page-builder-sidebar">
          <section className="admin-panel page-builder-section">
            <div className="page-builder-section-heading">
              <span>۳</span>
              <div>
                <h2>ذخیره و انتشار</h2>
                <p>پیش‌نویس فقط در پنل قابل مشاهده است.</p>
              </div>
            </div>
            <fieldset disabled={busy}>
              <div className="form-field">
                <label htmlFor="page-status">وضعیت صفحه</label>
                <select
                  id="page-status"
                  value={values.status}
                  onChange={(event) => change("status", event.target.value)}
                >
                  <option value="draft">پیش‌نویس</option>
                  <option value="review">در انتظار بررسی</option>
                  <option value="published">منتشرشده</option>
                  <option value="archived">بایگانی</option>
                </select>
                {fieldErrors("status")}
              </div>
              <JalaliDateField
                id="page-published-at"
                label="زمان انتشار (شمسی)"
                value={values.published_at}
                onChange={(value) => change("published_at", value)}
                withTime
                disabled={busy}
              />
              <span className="field-hint">
                برای انتشار فوری، زمان را خالی بگذارید. زمان آینده، انتشار را به
                همان تاریخ موکول می‌کند.
              </span>
              {fieldErrors("published_at")}
            </fieldset>
            <div className="page-builder-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={busy}
                onClick={() => {
                  intent.current = "save";
                }}
              >
                <Save size={17} />
                {busy ? "در حال ذخیره…" : "ذخیره صفحه"}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={busy}
                onClick={() => {
                  intent.current = "preview";
                  form.current?.requestSubmit();
                }}
              >
                <Eye size={17} />
                ذخیره و پیش‌نمایش
              </button>
            </div>
          </section>
          <section className="admin-panel page-builder-section">
            <h2>
              <Link2 size={18} />
              لینک و محل نمایش
            </h2>
            {record ? (
              <>
                <code className="page-builder-saved-path" dir="ltr">
                  {savedPath}
                </code>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void copyPath()}
                >
                  <Copy size={16} />
                  {copied ? "لینک کپی شد" : "کپی لینک صفحه"}
                </button>
                <Link
                  href={"/admin/menu-items/new?page_id=" + record.id}
                  prefetch={false}
                  className="primary-button"
                >
                  <Link2 size={17} />
                  افزودن به منوی سایت
                </Link>
                <p className="field-hint">
                  هدر، فوتر یا موبایل را انتخاب کنید؛ برای زیرمنو، منوی مادر را
                  مشخص کنید. لینک صفحه بعد از تغییر نشانی هم به‌روز می‌ماند.
                </p>
                <Link
                  href={"/admin/pages/" + record.id + "/preview"}
                  prefetch={false}
                  className="page-builder-preview-link"
                >
                  <Eye size={16} />
                  دیدن نسخه ذخیره‌شده
                </Link>
              </>
            ) : (
              <p className="field-hint">
                ابتدا صفحه را ذخیره کنید؛ سپس لینک آن را کپی کنید یا با دکمه
                «افزودن به منو» محل نمایش آن را انتخاب کنید.
              </p>
            )}
            <p className="field-hint">
              صفحه پیش‌نویس یا بایگانی‌شده در منوی عمومی نمایش داده نمی‌شود.
            </p>
          </section>
          <details className="admin-panel page-builder-section" inert={busy}>
            <summary>تنظیمات سئو</summary>
            <div className="form-field">
              <label htmlFor="page-meta-title">عنوان سئو</label>
              <input
                id="page-meta-title"
                maxLength={250}
                value={values.meta_title}
                onChange={(event) => change("meta_title", event.target.value)}
              />
              {fieldErrors("meta_title")}
            </div>
            <div className="form-field">
              <label htmlFor="page-meta-description">توضیح سئو</label>
              <textarea
                id="page-meta-description"
                maxLength={500}
                rows={3}
                value={values.meta_description}
                onChange={(event) =>
                  change("meta_description", event.target.value)
                }
              />
              {fieldErrors("meta_description")}
            </div>
          </details>
          <details className="admin-panel page-builder-section" inert={busy}>
            <summary>تصویر کارت و اسلایدشو</summary>
            <p className="field-hint">
              اختیاری؛ تصویر کارت در متن صفحه نمایش داده نمی‌شود. تصویرهای داخل
              صفحه را از ویرایشگر اضافه کنید.
            </p>
            <MediaPicker
              value={values.cover_id}
              onChange={(value) => change("cover_id", value)}
              choices={media}
              accept="image/*"
            />
            {fieldErrors("cover_id")}
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={values.show_in_slideshow}
                onChange={(event) =>
                  change("show_in_slideshow", event.target.checked)
                }
              />
              نمایش در اسلایدشو صفحه اصلی
            </label>
            {fieldErrors("show_in_slideshow")}
          </details>
        </aside>
      </form>
    </div>
  );
}
