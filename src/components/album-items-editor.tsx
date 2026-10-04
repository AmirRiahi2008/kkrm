"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Plus, Upload } from "lucide-react";
import { api } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import { mediaUrl, text } from "@/lib/shared";
import type { Entity } from "@/lib/types";

interface Item {
  media_id: number;
  caption: string;
  sort_order: number;
}
export function AlbumItemsEditor({
  album,
  media,
}: {
  album: Entity;
  media: Entity[];
}) {
  const [pool, setPool] = useState(media);
  const [items, setItems] = useState<Item[]>(
    Array.isArray(album.items)
      ? album.items.map((value, index) => {
          const row = value as Entity;
          const file = row.media as Entity;
          return {
            media_id: file.id,
            caption: text(row.caption),
            sort_order: index,
          };
        })
      : [],
  );
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
 const available = pool.filter((item) =>
  text(item.mime_type).startsWith("image/"),
);
  function append(id: number) {
    setItems((rows) =>
      rows.some((row) => row.media_id === id)
        ? rows
        : [...rows, { media_id: id, caption: "", sort_order: rows.length }],
    );
  }
  function move(index: number, delta: number) {
    setItems((rows) => {
      const next = [...rows];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  }
  async function upload(files: FileList) {
    setBusy(true);
    setMessage("");
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.set("file", file);
        body.set("alt", file.name);
        const { data } = await api<Entity>("/api/v1/admin/media", {
          method: "POST",
          body,
        });
        setPool((current) => [...current, data]);
        append(data.id);
      }
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      await api("/api/v1/admin/albums/" + album.id + "/items", {
        method: "PUT",
        body: JSON.stringify({
          items: items.map((item, index) => ({ ...item, sort_order: index })),
        }),
      });
      setMessage("رسانه‌های آلبوم ذخیره شدند.");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="admin-panel">
      <h2>رسانه‌های آلبوم</h2>
      <div className="album-add">
        <select
          aria-label="انتخاب رسانه آلبوم"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value="">انتخاب از کتابخانه</option>
          {available
            .filter((file) => !items.some((item) => item.media_id === file.id))
            .map((file) => (
              <option key={file.id} value={file.id}>
                {text(file.alt || file.original_name)}
              </option>
            ))}
        </select>
        <button
          type="button"
          className="secondary-button"
          disabled={!selected || items.length >= 100}
          onClick={() => {
            append(Number(selected));
            setSelected("");
          }}
        >
          <Plus size={16} />
          افزودن
        </button>
        <label className="upload-button">
          <Upload size={16} />
          بارگذاری چند فایل
          <input
            type="file"
            multiple
          accept="image/jpeg,image/png,image/webp"
            disabled={busy || items.length >= 100}
            onChange={(event) => {
              if (event.target.files) void upload(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      </div>
      <div className="album-editor-items">
        {items.map((item, index) => (
          <div key={item.media_id} className="album-editor-row">
           <img
  src={mediaUrl({ id: item.media_id })}
  alt={item.caption || "تصویر آلبوم"}
  loading="lazy"
/>
            <label>
              شرح رسانه
              <input
                value={item.caption}
                maxLength={250}
                onChange={(event) =>
                  setItems((rows) =>
                    rows.map((row, i) =>
                      i === index
                        ? { ...row, caption: event.target.value }
                        : row,
                    ),
                  )
                }
              />
            </label>
            <div>
              <button
                type="button"
                disabled={index === 0}
                aria-label="انتقال به بالا"
                onClick={() => move(index, -1)}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                disabled={index === items.length - 1}
                aria-label="انتقال به پایین"
                onClick={() => move(index, 1)}
              >
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                className="danger-link"
                aria-label="حذف از آلبوم"
                onClick={() =>
                  setItems((rows) => rows.filter((_, i) => i !== index))
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {message && <p role="status">{message}</p>}
      <button
        className="primary-button"
        type="button"
        disabled={busy}
        onClick={save}
      >
        {busy ? "در حال انجام…" : "ذخیره رسانه‌های آلبوم"}
      </button>
    </section>
  );
}
