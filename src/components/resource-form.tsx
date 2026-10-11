"use client";

import { resources } from "@/lib/admin-resources";
import { normalizeAdminDate } from "@/lib/admin-date";
import { JalaliDateField } from "./jalali-date-field";
import { api } from "@/lib/api-client";
import { ApiError, errorMessage } from "@/lib/errors";
import { entityPath, text, title } from "@/lib/shared";
import { selectedMenuDestination } from "@/lib/menu-placement";
import type { Entity, User, Value } from "@/lib/types";
import { RotateCcw, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlbumItemsEditor } from "./album-items-editor";
import { MediaPicker } from "./media-picker";
import { MenuPlacement } from "./menu-placement";
import { RichEditor } from "./rich-editor";
import { TariffRules, defaultRules } from "./tariff-rules";

function slugify(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}
function normalize(
  item: Entity | null,
  fields: (typeof resources)[string]["fields"],
) {
  const values: Record<string, Value> = {};
  for (const field of fields) {
    let value = item?.[field.key];
    if (field.key === "display_mode" && item && value == null)
      value = selectedMenuDestination(item);
    if (field.key === "tag_ids")
      value = (item?.tags as Entity[] | undefined)?.map((tag) => tag.id) || [];
    if (field.key === "attachment_ids")
      value =
        (item?.attachments as Entity[] | undefined)?.map((file) => file.id) ||
        [];
    if (field.key === "qualification_ids")
      value =
        (item?.qualifications as Entity[] | undefined)?.map((q) => q.id) || [];
    if (field.type === "date" || field.type === "datetime")
      value = normalizeAdminDate(value, field.type === "datetime");
    if (value === undefined || value === null) {
      if (field.type === "boolean")
        value = ["is_active", "is_published"].includes(field.key);
      else if (field.type === "multi") value = [];
      else if (field.type === "rules") value = defaultRules as unknown as Value;
      else if (field.type === "number") value = 0;
      else if (field.type === "select")
        value = field.options?.draft
          ? "draft"
          : Object.keys(field.options || {})[0] || "";
      else value = "";
    }
    values[field.key] = value;
  }
  return values;
}
export function ResourceForm({
  resource,
  initial,
  references,
  user,
  defaults = {},
}: {
  resource: string;
  initial: Entity | null;
  references: Record<string, Entity[]>;
  user: User;
  defaults?: Record<string, Value>;
}) {
  const config = resources[resource];
  const [values, setValues] = useState<Record<string, Value>>(() => ({
    ...normalize(initial, config.fields),
    ...(!initial && resource === "menu-items"
      ? { display_mode: "main", parent_id: null }
      : {}),
    ...(initial ? {} : defaults),
  }));
  const [baseline, setBaseline] = useState(() =>
    normalize(initial, config.fields),
  );
  const [record, setRecord] = useState(initial);
  const getEnglish = (item: Entity | null): Record<string, Value> => {
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
  };
  const [english, setEnglish] = useState(() => getEnglish(initial));
  const [englishBaseline, setEnglishBaseline] = useState(() =>
    getEnglish(initial),
  );
  const translatableKeys = [
    "title",
    "name",
    "question",
    "answer",
    "body",
    "biography",
    "description",
    "summary",
    "excerpt",
    "first_name",
    "last_name",
    "city",
    "geographical_scope",
    "position",
    "contact_label",
    "partner",
    "location",
    "bank_name",
    "holder",
    "purpose",
    "meta_title",
    "meta_description",
  ];
  const translationFields = [
    "users",
    "contact-messages",
    "redirects",
    "audit-logs",
  ].includes(resource)
    ? []
    : config.fields.filter((field) => translatableKeys.includes(field.key));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const router = useRouter();
  const fields = config.fields
    .filter(
      (field) =>
        user.role !== "editor" ||
        !["is_featured", "is_pinned", "show_in_slideshow"].includes(field.key),
    )
    .map((field) =>
      user.role === "editor" && field.key === "status"
        ? {
            ...field,
            options: { draft: "پیش‌نویس", review: "در انتظار بررسی" },
          }
        : field,
    );
  function change(key: string, value: Value) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (resource === "menu-items" && key === "page_id") {
        const page = references.pages?.find((item) => item.id === value);
        if (page) {
          next.url = entityPath("pages", page);
          if (!current.title) next.title = title(page);
        }
      }
      if (
        !record &&
        ["title", "name"].includes(key) &&
        "slug" in current &&
        (!current.slug || current.slug === slugify(text(current[key])))
      )
        next.slug = slugify(text(value));
      return next;
    });
    if (resource === "menu-items" && key === "location")
      setValues((current) => ({ ...current, parent_id: null }));
    setErrors((current) => ({ ...current, [key]: [] }));
  }
  async function reload() {
    if (
      !record ||
      !confirm("تغییرات ذخیره‌نشده کنار گذاشته و نسخه تازه دریافت شود؟")
    )
      return;
    setBusy(true);
    try {
      const { data } = await api<Entity>(
        "/api/v1/admin/" + resource + "/" + record.id,
      );
      setRecord(data);
      setEnglish(getEnglish(data));
      setEnglishBaseline(getEnglish(data));
      const next = normalize(data, config.fields);
      setValues(next);
      setBaseline(next);
      setConflict(false);
      setMessage("نسخه تازه دریافت شد.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage("");
    const payload: Record<string, Value> = {};
    for (const field of fields) {
      let value = values[field.key];
      if (
        record &&
        JSON.stringify(value) === JSON.stringify(baseline[field.key])
      )
        continue;
      if (field.type === "password" && !value) continue;
      if (!record && (value === "" || value === null) && !field.required)
        continue;
      if (
        ["date", "datetime", "ref", "media"].includes(field.type) &&
        value === ""
      )
        value = null;
      payload[field.key] = value;
    }
    const translated = Object.fromEntries(
      translationFields
        .filter(
          (field) =>
            text(english[field.key]) !== text(englishBaseline[field.key]),
        )
        .map((field) => [field.key, text(english[field.key]) || null]),
    );
    if (Object.keys(translated).length)
      payload.translations = { en: translated };
    if (!record && resource === "users" && !payload.password) {
      setErrors({ password: ["رمز عبور برای کاربر جدید الزامی است."] });
      setBusy(false);
      return;
    }
    if (resource === "posts" && record)
      payload.lock_version = record.lock_version;
    if (resource === "menu-items") {
      payload.location = values.location;
      payload.display_mode = values.display_mode;
      payload.parent_id = values.parent_id || null;
    }
    if ("status_code" in payload)
      payload.status_code = Number(payload.status_code);
    try {
      const { data } = await api<Entity>(
        "/api/v1/admin/" + resource + (record ? "/" + record.id : ""),
        { method: record ? "PATCH" : "POST", body: JSON.stringify(payload) },
      );
      if (!record && resource === "albums") {
        router.replace("/admin/albums/" + data.id);
        router.refresh();
      } else {
        const query =
          resource === "posts"
            ? "?status=" + encodeURIComponent(text(data.status))
            : "";
        router.push("/admin/" + resource + query);
        router.refresh();
      }
    } catch (error) {
      setMessage(errorMessage(error));
      if (error instanceof ApiError) {
        setErrors(error.errors);
        setConflict(error.status === 409);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>
            {record ? "ویرایش " : "افزودن "}
            {config.label}
          </h1>
          {record && <p>{title(record)}</p>}
        </div>
        <Link
          prefetch={false}
          className="secondary-button"
          href={"/admin/" + resource}
        >
          بازگشت به فهرست
        </Link>
      </div>
      {resource === "contact-messages" && record && (
        <section className="admin-panel contact-message">
          <h2>{text(record.subject)}</h2>
          <p>
            {text(record.name)} · {text(record.email)} · {text(record.phone)}
          </p>
          <p>{text(record.message)}</p>
        </section>
      )}
      <form className="resource-form admin-panel" onSubmit={submit}>
        {resource === "menu-items" && (
          <MenuPlacement
            values={values}
            items={references["menu-items"] || []}
            currentId={record?.id}
            disabled={busy}
            errors={errors}
            onChange={(update) => {
              setValues((current) => ({ ...current, ...update }));
              setErrors((current) => ({
                ...current,
                location: [],
                display_mode: [],
                parent_id: [],
              }));
            }}
          />
        )}
        <div className="form-grid">
          {fields
            .filter(
              (field) =>
                resource !== "menu-items" ||
                !["location", "display_mode", "parent_id"].includes(field.key),
            )
            .map((field) => (
              <div
                key={field.key}
                className={
                  "form-field " +
                  (["editor", "textarea", "rules", "media", "multi"].includes(
                    field.type,
                  )
                    ? "wide-field"
                    : "")
                }
              >
                {!["date", "datetime"].includes(field.type) && (
                  <label htmlFor={"field-" + field.key}>
                    {field.label}
                    {field.required && (
                      <span className="required-mark"> *</span>
                    )}
                  </label>
                )}
                {field.type === "date" || field.type === "datetime" ? (
                  <JalaliDateField
                    id={"field-" + field.key}
                    label={field.label}
                    value={text(values[field.key])}
                    onChange={(value) => change(field.key, value)}
                    withTime={field.type === "datetime"}
                    required={field.required}
                    disabled={busy}
                  />
                ) : field.type === "editor" ? (
                  <RichEditor
                    value={text(values[field.key])}
                    onChange={(html) => change(field.key, html)}
                  />
                ) : field.type === "media" ? (
                  <MediaPicker
                    value={Number(values[field.key]) || null}
                    onChange={(id) => change(field.key, id)}
                    choices={references.media || []}
                    accept={field.accept}
                    required={field.required}
                  />
                ) : field.type === "rules" ? (
                  <TariffRules
                    value={values[field.key] as unknown as typeof defaultRules}
                    onChange={(value) =>
                      change(field.key, value as unknown as Value)
                    }
                  />
                ) : field.type === "boolean" ? (
                  <input
                    id={"field-" + field.key}
                    type="checkbox"
                    checked={Boolean(values[field.key])}
                    onChange={(event) =>
                      change(field.key, event.target.checked)
                    }
                  />
                ) : field.type === "textarea" ? (
                  <textarea
                    id={"field-" + field.key}
                    rows={4}
                    value={text(values[field.key])}
                    required={field.required}
                    maxLength={field.key === "internal_note" ? 5000 : 1000}
                    onChange={(event) => change(field.key, event.target.value)}
                  />
                ) : ["select", "ref", "multi"].includes(field.type) ? (
                  <select
                    id={"field-" + field.key}
                    multiple={field.type === "multi"}
                    value={
                      field.type === "multi"
                        ? (values[field.key] as number[]).map(String)
                        : text(values[field.key])
                    }
                    required={field.required}
                    onChange={(event) =>
                      change(
                        field.key,
                        field.type === "multi"
                          ? Array.from(event.target.selectedOptions, (option) =>
                              Number(option.value),
                            )
                          : field.type === "ref"
                            ? Number(event.target.value) || null
                            : event.target.value,
                      )
                    }
                  >
                    {field.type !== "multi" && (
                      <option value="">انتخاب کنید</option>
                    )}
                    {field.type === "select"
                      ? Object.entries(field.options || {}).map(
                          ([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ),
                        )
                      : (references[field.source || ""] || [])
                          .filter(
                            (item) =>
                              resource !== "menu-items" ||
                              field.key !== "parent_id" ||
                              item.location === values.location,
                          )
                          .filter(
                            (item) =>
                              item.id !==
                              (field.key === "parent_id"
                                ? record?.id
                                : undefined),
                          )
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {title(item) ||
                                text(item.alt || item.original_name)}
                              {resource === "menu-items" &&
                              field.key === "parent_id"
                                ? " · " +
                                  ({
                                    header: "هدر",
                                    mobile: "موبایل",
                                    footer: "فوتر",
                                    quick: "دسترسی سریع",
                                  }[text(item.location)] || "") +
                                  " · " +
                                  item.id
                                : ""}
                            </option>
                          ))}
                  </select>
                ) : (
                  <input
                    id={"field-" + field.key}
                    type={field.type === "text" ? "text" : field.type}
                    value={text(values[field.key])}
                    disabled={
                      resource === "menu-items" &&
                      field.key === "url" &&
                      !!Number(values.page_id)
                    }
                    required={
                      field.required ||
                      (resource === "menu-items" &&
                        field.key === "url" &&
                        values.location === "header" &&
                        ["main", "both"].includes(text(values.display_mode)) &&
                        !Number(values.page_id)) ||
                      (!record &&
                        resource === "users" &&
                        field.type === "password")
                    }
                    min={field.type === "number" ? 0 : undefined}
                    minLength={field.type === "password" ? 12 : undefined}
                    maxLength={field.key === "slug" ? 180 : 2000}
                    autoComplete={
                      field.type === "password" ? "new-password" : "off"
                    }
                    onChange={(event) =>
                      change(
                        field.key,
                        field.type === "number"
                          ? Number(event.target.value)
                          : event.target.value,
                      )
                    }
                  />
                )}
                {field.hint && <span className="field-hint">{field.hint}</span>}
                {field.type === "multi" && (
                  <span className="field-hint">
                    برای چند انتخاب، کلید ⌘ یا Ctrl را نگه دارید.
                  </span>
                )}
                {Object.entries(errors)
                  .filter(
                    ([key]) =>
                      key === field.key || key.startsWith(field.key + "."),
                  )
                  .flatMap(([key, messages]) =>
                    messages.map((message, i) => (
                      <span className="field-error" key={key + i}>
                        {message}
                      </span>
                    )),
                  )}
              </div>
            ))}
        </div>
        {message && (
          <p role="alert" className="form-error">
            {message}
          </p>
        )}
        {conflict && (
          <button
            type="button"
            className="secondary-button"
            onClick={reload}
            disabled={busy}
          >
            <RotateCcw size={17} />
            دریافت نسخه تازه
          </button>
        )}
        {resource === "albums" && !record && (
          <p className="field-hint">
            پس از ثبت آلبوم، رسانه‌ها و ترتیب نمایش را اضافه کنید.
          </p>
        )}
        {translationFields.length > 0 && (
          <details className="translation-panel">
            <summary>نسخه انگلیسی محتوا · English</summary>
            <p>
              متن فارسی بالا حفظ می‌شود. فیلدهای انگلیسی را برای نمایش در نسخه
              English سایت وارد کنید. خالی‌کردن یک فیلد ترجمه، نسخه فارسی آن را
              به عنوان جایگزین نمایش می‌دهد.
            </p>
            <div className="form-grid">
              {translationFields.map((field) => (
                <div
                  key={field.key}
                  className={
                    "form-field " +
                    (["editor", "textarea"].includes(field.type)
                      ? "wide-field"
                      : "")
                  }
                >
                  <label htmlFor={"english-" + field.key}>
                    {field.label} · انگلیسی
                  </label>
                  <div dir="ltr">
                    {field.type === "editor" ? (
                      <RichEditor
                        value={text(english[field.key])}
                        onChange={(html) =>
                          setEnglish((current) => ({
                            ...current,
                            [field.key]: html,
                          }))
                        }
                      />
                    ) : field.type === "textarea" ? (
                      <textarea
                        id={"english-" + field.key}
                        rows={4}
                        value={text(english[field.key])}
                        maxLength={1000}
                        onChange={(event) =>
                          setEnglish((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }))
                        }
                      />
                    ) : (
                      <input
                        id={"english-" + field.key}
                        value={text(english[field.key])}
                        maxLength={250}
                        onChange={(event) =>
                          setEnglish((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                  {errors["translations.en." + field.key]?.map((error) => (
                    <span key={error} className="field-error">
                      {error}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </details>
        )}
        <div className="form-actions">
          <button className="primary-button" disabled={busy}>
            <Save size={17} />
            {busy ? "در حال ذخیره…" : "ذخیره تغییرات"}
          </button>
          <Link
            prefetch={false}
            href={"/admin/" + resource}
            className="secondary-button"
          >
            انصراف
          </Link>
        </div>
      </form>
      {resource === "albums" && record && (
        <AlbumItemsEditor album={record} media={references.media || []} />
      )}
    </>
  );
}
