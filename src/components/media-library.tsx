"use client";

import { useState, type FormEvent } from "react";
import { useAppRouter as useRouter } from "@/lib/use-app-router";
import { Upload, Trash2, ExternalLink, FileText } from "lucide-react";
import { api } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import { text, mediaUrl, faNumber } from "@/lib/shared";
import { Pages, Empty } from "./common";
import type { Entity, Pagination } from "@/lib/types";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function fileLabel(item: Entity): string {
  const mime = text(item.mime_type);
  const name = text(item.original_name);
  const extension = name.split(".").pop()?.toLowerCase();

  if (mime === "application/pdf") return "PDF";

  if (
    mime === "application/vnd.ms-excel" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    extension === "xls" ||
    extension === "xlsx"
  ) {
    return "Excel";
  }

  if (mime === "text/csv" || extension === "csv") return "CSV";
  if (mime.startsWith("video/")) return "فایل غیرمجاز";

  return "فایل";
}

export function MediaLibrary({
  items,
  pagination,
  query,
}: {
  items: Entity[];
  pagination?: Pagination;
  query: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    const form = event.currentTarget;
    const body = new FormData(form);
    const file = body.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setMessage("یک فایل معتبر انتخاب کنید.");
      return;
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setMessage("فقط تصاویر JPEG، PNG، WebP و فایل PDF مجاز هستند.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      await api("/api/v1/admin/media", {
        method: "POST",
        body,
      });

      form.reset();
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: Entity) {
    if (busy) return;
    if (!window.confirm("این فایل از کتابخانه حذف شود؟")) return;

    setBusy(true);
    setMessage("");

    try {
      await api(`/api/v1/admin/media/${item.id}`, {
        method: "DELETE",
      });

      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="admin-page-heading">
        <h1>کتابخانه رسانه</h1>
        <span>
          {faNumber(pagination?.total ?? items.length)} فایل
        </span>
      </div>

      <form
        className="admin-panel media-upload-form"
        onSubmit={upload}
        aria-busy={busy}
      >
        <label>
          فایل
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            disabled={busy}
            required
          />
        </label>

        <label>
          توضیح جایگزین
          <input
            name="alt"
            maxLength={250}
            placeholder="توضیح کوتاه فایل…"
            disabled={busy}
          />
        </label>

        <button
          type="submit"
          className="primary-button"
          disabled={busy}
        >
          <Upload size={17} aria-hidden="true" />
          {busy ? "در حال انجام…" : "بارگذاری"}
        </button>
      </form>

      {message && (
        <p role="alert" className="form-error">
          {message}
        </p>
      )}

      {items.length > 0 ? (
        <div className="media-grid">
          {items.map((item) => {
            const mime = text(item.mime_type);
            const image = mime.startsWith("image/");
            const video = mime.startsWith("video/");
            const name =
              text(item.alt) ||
              text(item.original_name) ||
              `فایل ${faNumber(item.id)}`;

            const url = mediaUrl({ id: item.id });
            const size = Number(item.size);
            const sizeKb =
              Number.isFinite(size) && size >= 0
                ? Math.round(size / 1024)
                : 0;

            return (
              <article key={item.id} className="media-card">
                <div className="media-preview">
                  {image ? (
                    <img
                      src={url}
                      alt={name}
                      loading="lazy"
                    />
                  ) : (
                    <span>
                      <FileText size={32} aria-hidden="true" />
                      {fileLabel(item)}
                    </span>
                  )}
                </div>

                <strong>{name}</strong>

                <small>
                  {mime} · {faNumber(sizeKb)} کیلوبایت
                </small>

                <div>
                  {!video && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={16} aria-hidden="true" />
                      مشاهده
                    </a>
                  )}

                  <button
                    type="button"
                    className="danger-link"
                    disabled={busy}
                    onClick={() => void remove(item)}
                    aria-label={`حذف ${name}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    حذف
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty />
      )}

      <Pages
        pagination={pagination}
        path="/admin/media"
        query={new URLSearchParams(query)}
      />
    </>
  );
}