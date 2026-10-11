"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { faNumber } from "@/lib/shared";
import type { ImageGalleryData } from "@/lib/image-gallery";
import "@/app/gallery-fit.css";

export function ImageLightbox({
  gallery,
  initialIndex,
  onClose,
}: {
  gallery: ImageGalleryData;
  initialIndex: number;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(0, initialIndex), gallery.images.length - 1),
  );
  const [failedSrc, setFailedSrc] = useState("");
  const image = gallery.images[index];

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    if (element && !element.open) element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      element?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  function move(offset: number) {
    setIndex(
      (current) =>
        (current + offset + gallery.images.length) % gallery.images.length,
    );
  }

  if (!image) return null;

  return (
    <dialog
      ref={dialog}
      className="inline-gallery-lightbox"
      aria-label={gallery.title || "نمایش آلبوم تصاویر"}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? 1 : -1);
        }
      }}
    >
      <div className="inline-gallery-lightbox-inner">
        <div className="inline-gallery-dialog-heading">
          <div>
            <strong>{gallery.title || "آلبوم تصاویر"}</strong>
            <span>
              {faNumber(index + 1)} از {faNumber(gallery.images.length)}
            </span>
          </div>
          <div>
            <a
              href={image.src}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="باز کردن عکس اصلی"
            >
              <ExternalLink size={20} />
            </a>
            <button
              type="button"
              aria-label="بستن نمایشگر تصاویر"
              onClick={onClose}
            >
              <X size={23} />
            </button>
          </div>
        </div>
        <div className="inline-gallery-lightbox-stage">
          {failedSrc === image.src ? (
            <p role="alert">
              نمایش این عکس انجام نشد.{" "}
              <a href={image.src} target="_blank" rel="noopener noreferrer">
                باز کردن عکس اصلی
              </a>
            </p>
          ) : (
            <img
              key={image.src}
              src={image.src}
              alt={image.alt || `تصویر ${faNumber(index + 1)}`}
              onError={() => setFailedSrc(image.src)}
              onLoad={() => setFailedSrc("")}
            />
          )}
          {gallery.images.length > 1 && (
            <>
              <button
                type="button"
                className="inline-gallery-previous"
                aria-label="عکس قبلی"
                onClick={() => move(-1)}
              >
                <ChevronRight size={27} />
              </button>
              <button
                type="button"
                className="inline-gallery-next"
                aria-label="عکس بعدی"
                onClick={() => move(1)}
              >
                <ChevronLeft size={27} />
              </button>
            </>
          )}
        </div>
        <p className="inline-gallery-image-caption" aria-live="polite">
          {image.alt || `تصویر ${faNumber(index + 1)}`}
        </p>
        {gallery.images.length > 1 && (
          <div className="inline-gallery-thumbnails" aria-label="انتخاب عکس">
            {gallery.images.map((thumbnail, i) => (
              <button
                type="button"
                key={`${thumbnail.src}-${i}`}
                aria-label={`نمایش عکس ${faNumber(i + 1)}`}
                aria-pressed={i === index}
                onClick={() => setIndex(i)}
              >
                <img src={thumbnail.src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </dialog>
  );
}
