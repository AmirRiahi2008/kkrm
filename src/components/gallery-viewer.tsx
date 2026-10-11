"use client";

import { number } from "@/lib/i18n";
import { mediaOf, mediaUrl, text } from "@/lib/shared";
import type { Entity } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Maximize,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import "@/app/gallery-fit.css";

export function GalleryViewer({ items: sourceItems }: { items: Entity[] }) {
  const { locale, t } = useLocale();
  const items = sourceItems.filter((item) =>
    mediaOf(item.media)?.mime_type.startsWith("image/"),
  );
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [grid, setGrid] = useState<"grid" | "large">("grid");
  const active = items.length ? items[index % items.length] : undefined;
  function move(delta: number) {
    if (!items.length) return;
    setIndex((current) => (current + delta + items.length) % items.length);
    setZoom(false);
  }
  return (
    <>
      <div className="gallery-toolbar">
        <p>
          {number(items.length, locale)} {t("رسانه")}
        </p>
        <div>
          <button
            type="button"
            aria-pressed={grid === "grid"}
            onClick={() => setGrid("grid")}
          >
            {t("نمای شبکه‌ای")}
          </button>
          <button
            type="button"
            aria-pressed={grid === "large"}
            onClick={() => setGrid("large")}
          >
            {t("نمای بزرگ")}
          </button>
        </div>
      </div>
      {!items.length && (
        <p className="quiet">{t("رسانه‌ای برای این آلبوم اضافه نشده است.")}</p>
      )}
      <div className={"gallery-masonry " + grid}>
        {items.map((item, i) => (
          <button
            type="button"
            key={item.id}
            onClick={() => {
              setIndex(i);
              setZoom(false);
              dialog.current?.showModal();
            }}
            className="gallery-tile"
            aria-label={
              t("نمایش") +
              " " +
              (text(item.caption) || t("رسانه") + " " + number(i + 1, locale))
            }
          >
            <img
              src={mediaUrl(item.media)}
              alt={text(item.caption) || t("تصویر آلبوم")}
              loading="lazy"
            />
            <span>
              <Maximize size={17} />
              {text(item.caption) || t("مشاهده رسانه")}
            </span>
          </button>
        ))}
      </div>
      <dialog
        className="gallery-dialog"
        ref={dialog}
        aria-label={t("نمایشگر تصاویر")}
        onClose={() => setZoom(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(locale === "en" ? -1 : 1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(locale === "en" ? 1 : -1);
          }
        }}
      >
        {active && (
          <>
            <div className="viewer-header">
              <span>
                {number((index % items.length) + 1, locale)} /{" "}
                {number(items.length, locale)}
              </span>
              <div>
                <button
                  type="button"
                  onClick={() => setZoom(!zoom)}
                  aria-label={t(zoom ? "کوچک‌نمایی" : "بزرگ‌نمایی")}
                >
                  {zoom ? <ZoomOut /> : <ZoomIn />}
                </button>
                <a
                  href={mediaUrl(active.media)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("باز کردن فایل اصلی")}
                >
                  <Download />
                </a>
                <button
                  type="button"
                  aria-label={t("بستن نمایشگر")}
                  onClick={() => dialog.current?.close()}
                >
                  <X />
                </button>
              </div>
            </div>
            <div className="viewer-stage">
              <button
                type="button"
                aria-label={t("رسانه قبلی")}
                onClick={() => move(-1)}
              >
                {locale === "en" ? <ArrowLeft /> : <ArrowRight />}
              </button>
              <div className={"viewer-media " + (zoom ? "zoomed" : "")}>
                <img
                  src={mediaUrl(active.media)}
                  alt={text(active.caption) || t("تصویر آلبوم")}
                />
              </div>
              <button
                type="button"
                aria-label={t("رسانه بعدی")}
                onClick={() => move(1)}
              >
                {locale === "en" ? <ArrowRight /> : <ArrowLeft />}
              </button>
            </div>
            <p className="viewer-caption">{text(active.caption)}</p>
            <div className="viewer-thumbnails">
              {items.map((item, i) => (
                <button
                  type="button"
                  key={item.id}
                  aria-label={t("رسانه") + " " + number(i + 1, locale)}
                  aria-current={i === index % items.length ? "true" : undefined}
                  onClick={() => {
                    setIndex(i);
                    setZoom(false);
                  }}
                >
                  <img src={mediaUrl(item.media)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
