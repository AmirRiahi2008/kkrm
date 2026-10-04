"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { ApiError, errorMessage } from "@/lib/errors";
import { text } from "@/lib/shared";
import { MediaPicker } from "./media-picker";
import type { Entity, Value } from "@/lib/types";

const labels: Record<string, string> = {
  site_name: "نام سایت",
  site_description: "معرفی کانون",
  site_email: "ایمیل",
  site_phone: "تلفن",
  site_address: "نشانی",
  office_hours: "ساعات پاسخگویی",
  announcement_ticker: "متن متحرک هدر",
  copyright: "حقوق سایت",
  map_latitude: "عرض جغرافیایی",
  map_longitude: "طول جغرافیایی",
  logo_media_id: "لوگو",
  favicon_media_id: "آیکون سایت",
};
export function SettingsForm({
  initial,
  media,
}: {
  initial: Record<string, Value>;
  media: Entity[];
}) {
  const [values, setValues] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setErrors({});
    const settings = Object.fromEntries(
      Object.entries(values).filter(([key, value]) => value !== baseline[key]),
    );
    if (!Object.keys(settings).length) {
      setMessage("تغییری برای ذخیره وجود ندارد.");
      setBusy(false);
      return;
    }
    try {
      const { data } = await api<Record<string, Value>>(
        "/api/v1/admin/settings",
        { method: "PUT", body: JSON.stringify({ settings }) },
      );
      setValues(data);
      setBaseline(data);
      setMessage("تنظیمات ذخیره شد.");
    } catch (error) {
      setMessage(errorMessage(error));
      if (error instanceof ApiError) setErrors(error.errors);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-page-heading">
        <h1>تنظیمات سایت</h1>
      </div>
      <form className="admin-panel" onSubmit={submit}>
        <div className="form-grid">
          {Object.entries(labels).map(([key, label]) => (
            <div className="form-field" key={key}>
              <label htmlFor={"setting-" + key}>{label}</label>
              {key.endsWith("_media_id") ? (
                <MediaPicker
                  value={Number(values[key]) || null}
                  choices={media}
                  onChange={(id) => setValues({ ...values, [key]: id })}
                />
              ) : ["site_description", "site_address"].includes(key) ? (
                <textarea
                  id={"setting-" + key}
                  rows={4}
                  maxLength={1000}
                  value={text(values[key])}
                  onChange={(event) =>
                    setValues({ ...values, [key]: event.target.value })
                  }
                />
              ) : (
                <input
                  id={"setting-" + key}
                  type={
                    key.startsWith("map_")
                      ? "number"
                      : key === "site_email"
                        ? "email"
                        : "text"
                  }
                  step={key.startsWith("map_") ? "any" : undefined}
                  value={text(values[key])}
                  maxLength={500}
                  onChange={(event) =>
                    setValues({
                      ...values,
                      [key]: key.startsWith("map_")
                        ? Number(event.target.value)
                        : event.target.value,
                    })
                  }
                />
              )}
              {errors["settings." + key]?.map((error) => (
                <span key={error} className="field-error">
                  {error}
                </span>
              ))}
            </div>
          ))}
        </div>
        {message && <p role="status">{message}</p>}
        <button className="primary-button" disabled={busy}>
          {busy ? "در حال ذخیره…" : "ذخیره تنظیمات"}
        </button>
      </form>
    </>
  );
}
