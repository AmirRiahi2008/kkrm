"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown, Images, Trash2, Upload, X } from "lucide-react";
import { api } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import { mediaUrl, faNumber } from "@/lib/shared";
import {
  MAX_GALLERY_IMAGES,
  MAX_GALLERY_IMAGE_BYTES,
  normalizeGallery,
} from "@/lib/image-gallery";
import type { GalleryImage, ImageGalleryData } from "@/lib/image-gallery";
import type { Entity } from "@/lib/types";

export function GalleryEditorDialog({
  initial,
  editing,
  onSave,
  onClose,
}: {
  initial: ImageGalleryData;
  editing: boolean;
  onSave: (gallery: ImageGalleryData) => boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const [gallery, setGallery] = useState(() => normalizeGallery(initial));
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    mounted.current = true;
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    return () => {
      mounted.current = false;
      abort.current?.abort();
      element?.close();
    };
  }, []);

  async function upload(files: File[]) {
    if (lock.current || !files.length) return;
    setError("");
    if (gallery.images.length + files.length > MAX_GALLERY_IMAGES) {
      setError(
        `هر آلبوم می‌تواند حداکثر ${faNumber(MAX_GALLERY_IMAGES)} عکس داشته باشد.`,
      );
      return;
    }
    const invalid = files.find(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > MAX_GALLERY_IMAGE_BYTES,
    );
    if (invalid) {
      setError(
        `فایل «${invalid.name}» مجاز نیست. فقط JPEG، PNG و WebP، حداکثر ۴ مگابایت برای هر عکس.`,
      );
      return;
    }
    lock.current = true;
    abort.current = new AbortController();
    setUploading(true);
    try {
      for (const [index, image] of files.entries()) {
        if (!mounted.current || abort.current.signal.aborted) break;
        setProgress(
          `بارگذاری عکس ${faNumber(index + 1)} از ${faNumber(files.length)}`,
        );
        const body = new FormData();
        body.set("file", image);
        body.set("alt", image.name.slice(0, 250));
        const { data } = await api<Entity>("/api/v1/admin/media", {
          method: "POST",
          body,
          signal: abort.current.signal,
        });
        if (!mounted.current || abort.current.signal.aborted) break;
        const src = mediaUrl(data);
        if (!src) throw new Error("نشانی تصویر بارگذاری‌شده معتبر نیست.");
        setGallery((current) => ({
          ...current,
          images: [...current.images, { src, alt: image.name.slice(0, 250) }],
        }));
      }
    } catch (reason) {
      if (mounted.current && !abort.current?.signal.aborted) {
        setError(
          `${errorMessage(reason)} عکس‌های موفق حفظ شده‌اند؛ فایل‌های باقی‌مانده را دوباره انتخاب کنید.`,
        );
      }
    } finally {
      lock.current = false;
      if (mounted.current) {
        setUploading(false);
        setProgress("");
      }
    }
  }

  function changeImage(index: number, change: Partial<GalleryImage>) {
    setGallery((current) => ({
      ...current,
      images: current.images.map((image, i) =>
        i === index ? { ...image, ...change } : image,
      ),
    }));
  }

  function move(index: number, offset: number) {
    setGallery((current) => {
      const images = [...current.images];
      const target = index + offset;
      if (target < 0 || target >= images.length) return current;
      [images[index], images[target]] = [images[target], images[index]];
      return { ...current, images };
    });
  }

  function save() {
    if (lock.current || !gallery.images.length) return;
    if (!onSave(normalizeGallery(gallery))) {
      setError("درج آلبوم انجام نشد. جای درج را دوباره در متن انتخاب کنید.");
    }
  }

  return (
    <dialog
      ref={dialog}
      className="inline-gallery-editor"
      aria-labelledby="gallery-editor-title"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !uploading) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <div className="inline-gallery-dialog-heading">
        <h2 id="gallery-editor-title">
          <Images size={22} />
          {editing ? "ویرایش آلبوم تصاویر" : "افزودن آلبوم تصاویر"}
        </h2>
        <button type="button" aria-label="بستن آلبوم" onClick={onClose}>
          <X size={22} />
        </button>
      </div>
      <p className="inline-gallery-hint">
        چند عکس را انتخاب کنید؛ ترتیب، توضیح هر عکس و تعداد ستون‌ها را تغییر
        دهید. پس از درج آلبوم، مطلب را ذخیره کنید.
      </p>
      <div className="inline-gallery-fields">
        <label>
          عنوان آلبوم (اختیاری)
          <input
            value={gallery.title}
            maxLength={150}
            onChange={(event) =>
              setGallery((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
          />
        </label>
        <label>
          ستون‌ها در نمایش دسکتاپ
          <select
            value={gallery.columns}
            onChange={(event) =>
              setGallery((current) => ({
                ...current,
                columns: Number(event.target.value) as 2 | 3 | 4,
              }))
            }
          >
            <option value={2}>۲ ستون</option>
            <option value={3}>۳ ستون</option>
            <option value={4}>۴ ستون</option>
          </select>
        </label>
      </div>
      <div className="inline-gallery-upload">
        <button
          type="button"
          className="primary-button"
          disabled={uploading || gallery.images.length >= MAX_GALLERY_IMAGES}
          onClick={() => input.current?.click()}
        >
          <Upload size={18} />
          {uploading ? "در حال بارگذاری…" : "انتخاب چند عکس"}
        </button>
        <span>
          {faNumber(gallery.images.length)} عکس از{" "}
          {faNumber(MAX_GALLERY_IMAGES)}
        </span>
        <input
          ref={input}
          hidden
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={(event) => {
            const files = Array.from(event.target.files || []);
            event.target.value = "";
            void upload(files);
          }}
        />
      </div>
      {progress && (
        <p role="status" className="inline-gallery-hint">
          {progress}
        </p>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="inline-gallery-edit-grid">
        {gallery.images.map((image, index) => (
          <div
            className="inline-gallery-edit-card"
            key={`${image.src}-${index}`}
          >
            <img src={image.src} alt={image.alt} />
            <label>
              توضیح عکس {faNumber(index + 1)}
              <input
                value={image.alt}
                maxLength={250}
                onChange={(event) =>
                  changeImage(index, { alt: event.target.value })
                }
              />
            </label>
            <div className="inline-gallery-edit-actions">
              <button
                type="button"
                title="جابه‌جایی به قبل"
                aria-label={`عکس ${faNumber(index + 1)} به قبل`}
                disabled={uploading || index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp size={17} />
              </button>
              <button
                type="button"
                title="جابه‌جایی به بعد"
                aria-label={`عکس ${faNumber(index + 1)} به بعد`}
                disabled={uploading || index === gallery.images.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown size={17} />
              </button>
              <button
                type="button"
                title="حذف از آلبوم"
                aria-label={`حذف عکس ${faNumber(index + 1)} از آلبوم`}
                disabled={uploading}
                onClick={() =>
                  setGallery((current) => ({
                    ...current,
                    images: current.images.filter((_, i) => i !== index),
                  }))
                }
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {!gallery.images.length && (
        <div className="inline-gallery-empty">
          <Images size={36} />
          <p>هنوز عکسی انتخاب نشده است.</p>
        </div>
      )}
      <div className="inline-gallery-dialog-footer">
        <button
          type="button"
          className="primary-button"
          disabled={uploading || !gallery.images.length}
          onClick={save}
        >
          {editing ? "اعمال تغییرات آلبوم" : "درج آلبوم در محل انتخاب‌شده"}
        </button>
        <button type="button" onClick={onClose}>
          انصراف
        </button>
      </div>
    </dialog>
  );
}
