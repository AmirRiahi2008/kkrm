"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, RotateCcw } from "lucide-react";
import { resources } from "@/lib/admin-resources";
import { api } from "@/lib/api-client";
import { ApiError, errorMessage } from "@/lib/errors";
import { text, title } from "@/lib/shared";
import { RichEditor } from "./rich-editor";
import { MediaPicker } from "./media-picker";
import { TariffRules, defaultRules } from "./tariff-rules";
import { AlbumItemsEditor } from "./album-items-editor";
import type { Entity, User, Value } from "@/lib/types";

function slugify(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}
function inputDate(value: Value, dateOnly: boolean) {
  if (!value) return "";
  if (dateOnly) return text(value).slice(0, 10);
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(text(value)))
    .replace(" ", "T");
}
function normalize(
  item: Entity | null,
  fields: (typeof resources)[string]["fields"],
) {
  const values: Record<string, Value> = {};
  for (const field of fields) {
    let value = item?.[field.key];
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
      value = inputDate(value, field.type === "date");
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
}: {
  resource: string;
  initial: Entity | null;
  references: Record<string, Entity[]>;
  user: User;
}) {
  const config = resources[resource];
  const [values, setValues] = useState(() => normalize(initial, config.fields));
  const [baseline, setBaseline] = useState(() =>
    normalize(initial, config.fields),
  );
  const [record, setRecord] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const router = useRouter();
  const fields = config.fields
    .filter(
      (field) =>
        user.role !== "editor" ||
        !["is_featured", "is_pinned"].includes(field.key),
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
      if (
        !record &&
        ["title", "name"].includes(key) &&
        "slug" in current &&
        (!current.slug || current.slug === slugify(text(current[key])))
      )
        next.slug = slugify(text(value));
      return next;
    });
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
      if (field.type === "datetime")
        value = value ? new Date(text(value) + "+03:30").toISOString() : null;
      if (["date", "ref", "media"].includes(field.type) && value === "")
        value = null;
      payload[field.key] = value;
    }
    if (!record && resource === "users" && !payload.password) {
      setErrors({ password: ["رمز عبور برای کاربر جدید الزامی است."] });
      setBusy(false);
      return;
    }
    if (resource === "posts" && record)
      payload.lock_version = record.lock_version;
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
        <div className="form-grid">
          {fields.map((field) => (
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
              <label htmlFor={"field-" + field.key}>
                {field.label}
                {field.required && <span className="required-mark"> *</span>}
              </label>
              {field.type === "editor" ? (
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
                  onChange={(event) => change(field.key, event.target.checked)}
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
                            item.id !==
                            (field.key === "parent_id"
                              ? record?.id
                              : undefined),
                        )
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {title(item) ||
                              text(item.alt || item.original_name)}
                          </option>
                        ))}
                </select>
              ) : (
                <input
                  id={"field-" + field.key}
                  type={
                    field.type === "datetime"
                      ? "datetime-local"
                      : field.type === "text"
                        ? "text"
                        : field.type
                  }
                  value={text(values[field.key])}
                  required={
                    field.required ||
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
              {field.type === "datetime" && (
                <span className="field-hint">تاریخ میلادی، ساعت تهران</span>
              )}
              {field.type === "date" && (
                <span className="field-hint">تاریخ میلادی</span>
              )}
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
