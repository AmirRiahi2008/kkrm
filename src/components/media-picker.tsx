"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { api } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import { mediaUrl, text } from "@/lib/shared";
import type { Entity } from "@/lib/types";

export function MediaPicker({
  value,
  onChange,
  choices,
  accept = "image/*",
  required,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
  choices: Entity[];
  accept?: string;
  required?: boolean;
}) {
  const [added, setAdded] = useState<Entity[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const uploadLock = useRef(false);
  const pool = [...added, ...choices].filter(
    (item, i, array) => array.findIndex((m) => m.id === item.id) === i,
  );
  const imagesOnly = accept === "image/*";
  const available = pool.filter(
    (item) => !imagesOnly || text(item.mime_type).startsWith("image/"),
  );
  const selected = pool.find((item) => item.id === value);
  async function upload(file: File) {
    if (uploadLock.current) return;
    setError("");
    if (file.size > 4 * 1024 * 1024) {
      setError(
        "برای بارگذاری از مسیر ورسل، حجم فایل باید حداکثر ۴ مگابایت باشد.",
      );
      return;
    }
    if (
      imagesOnly &&
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setError("برای تصویر فقط JPEG، PNG و WebP انتخاب کنید.");
      return;
    }
    uploadLock.current = true;
    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("alt", file.name);
      const { data } = await api<Entity>("/api/v1/admin/media", {
        method: "POST",
        body,
      });
      setAdded((items) => [data, ...items]);
      onChange(data.id);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      uploadLock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="media-picker">
      <select
        disabled={busy}
        value={value || ""}
        onChange={(event) =>
          onChange(event.target.value ? Number(event.target.value) : null)
        }
        required={required}
        aria-label="انتخاب رسانه"
      >
        <option value="">انتخاب از کتابخانه</option>
        {available.map((item) => (
          <option key={item.id} value={item.id}>
            {text(item.alt || item.original_name) || "رسانه " + item.id}
          </option>
        ))}
      </select>
      <label className="upload-button">
        <Upload size={17} />
        {busy ? "در حال بارگذاری…" : "بارگذاری فایل"}
        <input
          type="file"
          accept={accept}
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
      </label>
      {selected && (
        <div className="selected-media">
          {text(selected.mime_type).startsWith("image/") && (
            <img src={mediaUrl(selected)} alt={text(selected.alt)} />
          )}
          <span>{text(selected.alt || selected.original_name)}</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => onChange(null)}
            aria-label="حذف انتخاب"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
