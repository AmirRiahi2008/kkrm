"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
} from "lucide-react";
import { faNumber, mediaOf, mediaUrl, text } from "@/lib/shared";
import type { Entity } from "@/lib/types";

export function GalleryViewer({
  items: sourceItems,
}: {
  items: Entity[];
}) {
  const items = sourceItems.filter((item) =>
    mediaOf(item.media)?.mime_type.startsWith("image/"),
  );
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [grid, setGrid] = useState<"grid" | "large">("grid");
  const active = items[index];
  function move(delta: number) {
    if (!items.length) return;
    setIndex((current) => (current + delta + items.length) % items.length);
    setZoom(false);
  }
  return (
    <>
      <div className="gallery-toolbar">
        <p>{faNumber(items.length)} رسانه</p>
        <div>
          <button
            aria-pressed={grid === "grid"}
            onClick={() => setGrid("grid")}
          >
            نمای شبکه‌ای
          </button>
          <button
            aria-pressed={grid === "large"}
            onClick={() => setGrid("large")}
          >
            نمای بزرگ
          </button>
        </div>
      </div>
      {!items.length && (
        <p className="quiet">رسانه‌ای برای این آلبوم اضافه نشده است.</p>
      )}
      <div className={"gallery-masonry " + grid}>
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => {
              setIndex(i);
              setZoom(false);
              dialog.current?.showModal();
            }}
            className="gallery-tile"
            aria-label={
              "نمایش " + (text(item.caption) || "رسانه " + faNumber(i + 1))
            }
          >
            {mediaOf(item.media)?.mime_type.startsWith("video/") ? (
              <video src={mediaUrl(item.media, "")} muted preload="metadata" />
            ) : (
              <img
                src={mediaUrl(item.media)}
                alt={text(item.caption) || "تصویر آلبوم"}
                loading="lazy"
              />
            )}
            <span>
              <Maximize size={17} />
              {text(item.caption) || "مشاهده رسانه"}
            </span>
          </button>
        ))}
      </div>
      <dialog
        className="gallery-dialog"
        ref={dialog}
        onClose={() => {
          setZoom(false);
          dialog.current
            ?.querySelectorAll("video")
            .forEach((video) => video.pause());
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(1);
          if (event.key === "ArrowRight") move(-1);
        }}
      >
        {active && (
          <>
            <div className="viewer-header">
              <span>
                {faNumber(index + 1)} / {faNumber(items.length)}
              </span>
              <div>
                <button
                  onClick={() => setZoom(!zoom)}
                  aria-label={zoom ? "کوچک‌نمایی" : "بزرگ‌نمایی"}
                >
                  {zoom ? <ZoomOut /> : <ZoomIn />}
                </button>
                <a
                  href={mediaUrl(active.media)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="باز کردن فایل اصلی"
                >
                  <Download />
                </a>
                <button
                  aria-label="بستن نمایشگر"
                  onClick={() => dialog.current?.close()}
                >
                  <X />
                </button>
              </div>
            </div>
            <div className="viewer-stage">
              <button aria-label="رسانه قبلی" onClick={() => move(-1)}>
                <ArrowRight />
              </button>
              <div className={"viewer-media " + (zoom ? "zoomed" : "")}>
                {mediaOf(active.media)?.mime_type.startsWith("video/") ? (
                  <video
                    key={active.id}
                    src={mediaUrl(active.media, "")}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={mediaUrl(active.media)}
                    alt={text(active.caption) || "تصویر آلبوم"}
                  />
                )}
              </div>
              <button aria-label="رسانه بعدی" onClick={() => move(1)}>
                <ArrowLeft />
              </button>
            </div>
            <p className="viewer-caption">{text(active.caption)}</p>
            <div className="viewer-thumbnails">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  aria-label={"رسانه " + (i + 1)}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => {
                    setIndex(i);
                    setZoom(false);
                  }}
                >
                  {mediaOf(item.media)?.mime_type.startsWith("video/") ? (
                    <span>ویدئو {faNumber(i + 1)}</span>
                  ) : (
                    <img src={mediaUrl(item.media)} alt="" loading="lazy" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
