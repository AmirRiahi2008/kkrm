"use client";

import "@/app/hero-slider.css";
import { useLocale } from "@/components/locale-provider";
import Link from "@/components/localized-link";
import { localDate, number } from "@/lib/i18n";
import {
  entityPath,
  mediaOf,
  mediaUrl,
  postTypes,
  documentTypes,
  text,
  title,
} from "@/lib/shared";
import type { Entity, NewsSection } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  ImageOff,
  Pause,
  Play,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface CarouselState {
  index: number;
  requested: number[];
}

function selectSlide(
  current: CarouselState,
  target: number,
  count: number,
): CarouselState {
  if (!count) return current;
  const index = ((target % count) + count) % count;
  return {
    index,
    requested: Array.from(
      new Set([
        ...current.requested,
        index,
        (index + 1) % count,
        (index + count - 1) % count,
      ]),
    ),
  };
}

function HeroFrame({
  item,
  active,
  requested,
  src,
  href,
  position,
  count,
}: {
  item: Entity;
  active: boolean;
  requested: boolean;
  src: string;
  href: string | null;
  position: number;
  count: number;
}) {
  const { locale, t } = useLocale();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const imageRef = useCallback((image: HTMLImageElement | null) => {
    if (image?.complete && image.naturalWidth > 0) {
      void image
        .decode()
        .catch(() => undefined)
        .then(() => setStatus("ready"));
    }
  }, []);
  return (
    <article
      className={
        "hero-slide" + (!src || status === "error" ? " without-image" : "")
      }
      hidden={!active}
      role="group"
      aria-roledescription={t("اسلاید")}
      aria-label={
        t("اسلاید") +
        " " +
        number(position + 1, locale) +
        " " +
        t("از") +
        " " +
        number(count, locale)
      }
      aria-busy={active && !!src && status === "loading"}
    >
      {requested && src && (
        <Image
          ref={imageRef}
          src={src}
          alt={title(item)}
          fill
          unoptimized
          sizes="(max-width: 959px) 100vw, (max-width: 1279px) 55vw, 44vw"
          loading="eager"
          decoding="async"
          fetchPriority={active ? "high" : "low"}
          className={"hero-image" + (status === "ready" ? " is-ready" : "")}
          onLoad={(event) => {
            const image = event.currentTarget;
            void image
              .decode()
              .catch(() => undefined)
              .then(() => setStatus("ready"));
          }}
          onError={() => setStatus("error")}
        />
      )}
      {active && src && status === "loading" && (
        <div className="hero-image-status" role="status">
          <LoaderCircle className="hero-image-spinner" size={28} />
          <span>{t("در حال دریافت تصویر…")}</span>
        </div>
      )}
      {active && (!src || status === "error") && (
        <div className="hero-image-status hero-image-empty">
          <ImageOff size={40} strokeWidth={1.4} aria-hidden="true" />
          <span>
            {locale === "en"
              ? src
                ? "The image could not be loaded."
                : "This content has no image."
              : src
                ? "تصویر این محتوا دریافت نشد."
                : "این محتوا تصویر ندارد"}
          </span>
        </div>
      )}
      <div className="hero-caption">
        <div className="hero-news-meta">
          <span>
            {t(
              postTypes[text(item.type)] ||
                documentTypes[text(item.type)] ||
                {
                  pages: "صفحات کانون",
                  albums: "گالری تصاویر",
                  events: "رویدادهای کانون",
                  agreements: "قراردادها و تفاهم‌نامه‌ها",
                }[text(item.slide_resource)] ||
                "اخبار کانون",
            )}
          </span>
          {item.published_at && (
            <time dateTime={text(item.published_at)}>
              {localDate(item.published_at, locale)}
            </time>
          )}
        </div>
        <h1>{title(item)}</h1>
        {href && (
          <Link prefetch={false} className="hero-details" href={href}>
            {t("مشاهده جزئیات")}
            <ChevronLeft size={17} />
          </Link>
        )}
      </div>
    </article>
  );
}

export function Hero({
  posts,
  unavailable = false,
}: {
  posts: Entity[];
  unavailable?: boolean;
}) {
  const { locale, t } = useLocale();
  const dots = useRef<HTMLDivElement>(null);
  const data = posts;
  const count = data.length;
  const pointerStart = useRef<{ id: number; x: number; y: number } | null>(
    null,
  );
  const [state, setState] = useState<CarouselState>(() =>
    selectSlide({ index: 0, requested: [] }, 0, count),
  );
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const index = count ? state.index % count : 0;
  const move = useCallback(
    (delta: number) => {
      setState((current) => selectSlide(current, current.index + delta, count));
    },
    [count],
  );
  useEffect(() => {
    if (
      paused ||
      hovered ||
      focused ||
      count < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = window.setInterval(() => {
      if (!document.hidden) move(1);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused, hovered, focused, count, index, move]);
  useEffect(() => {
    const bar = dots.current;
    const active = bar?.children[index] as HTMLElement | undefined;
    if (!bar || !active) return;
    bar.scrollLeft =
      active.offsetLeft - bar.clientWidth / 2 + active.offsetWidth / 2;
  }, [index, count]);
  if (!count) {
    return (
      <div
        className="hero-carousel hero-fast hero-empty"
        role="region"
        aria-label={t("اسلایدر اخبار کانون")}
      >
        <ImageOff size={36} aria-hidden="true" />
        <p>
          {locale === "en"
            ? unavailable
              ? "The slideshow is temporarily unavailable."
              : "No content has been selected for the slideshow yet."
            : unavailable
              ? "دریافت اسلایدشو موقتاً امکان‌پذیر نیست."
              : "هنوز محتوایی برای اسلایدشو انتخاب نشده است."}
        </p>
        <Link href="/news" prefetch={false}>
          {t("اخبار کانون")}
        </Link>
      </div>
    );
  }
  return (
    <div
      className="hero-carousel hero-fast"
      data-slide-kind="content"
      role="region"
      aria-roledescription={t("اسلایدر")}
      aria-label={t("اسلایدر اخبار کانون")}
      tabIndex={0}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" || !event.isPrimary) return;
        if ((event.target as HTMLElement).closest("a, button")) return;
        pointerStart.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        };
      }}
      onPointerUp={(event) => {
        const start = pointerStart.current;
        pointerStart.current = null;
        if (!start || start.id !== event.pointerId || count < 2) return;
        const deltaX = event.clientX - start.x;
        const deltaY = event.clientY - start.y;
        if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.4)
          return;
        move((deltaX < 0 ? 1 : -1) * (locale === "en" ? 1 : -1));
      }}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
      onPointerLeave={() => {
        pointerStart.current = null;
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(locale === "en" ? 1 : -1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(locale === "en" ? -1 : 1);
        }
      }}
    >
      {data.map((item, offset) => {
        const position = offset;
        const cover = mediaOf(item.cover);
        const src = cover ? mediaUrl({ id: cover.id }) : "";
        const active = position === index;
        const neighbor =
          position === (index + 1) % count ||
          position === (index + count - 1) % count;
        const resource = text(item.slide_resource) || "news";
        const href = entityPath(resource, item);
        return (
          <HeroFrame
            key={resource + "-" + item.id + "-" + position + "-" + src}
            item={item}
            active={active}
            requested={active || neighbor || state.requested.includes(position)}
            src={src}
            href={href}
            position={position}
            count={count}
          />
        );
      })}
      {count > 1 && (
        <>
          <button
            type="button"
            className="hero-prev"
            aria-label={t("اسلاید قبلی")}
            title={t("اسلاید قبلی")}
            onClick={() => move(-1)}
          >
            {locale === "en" ? <ChevronLeft /> : <ChevronRight />}
          </button>
          <button
            type="button"
            className="hero-next"
            aria-label={t("اسلاید بعدی")}
            title={t("اسلاید بعدی")}
            onClick={() => move(1)}
          >
            {locale === "en" ? <ChevronRight /> : <ChevronLeft />}
          </button>
          <div
            ref={dots}
            className="hero-dots"
            role="group"
            aria-label={t("انتخاب اسلاید")}
          >
            {Array.from({ length: count }, (_, position) => (
              <button
                type="button"
                key={
                  text(data[position].slide_resource) + "-" + data[position].id
                }
                aria-label={t("اسلاید") + " " + number(position + 1, locale)}
                title={title(data[position])}
                aria-pressed={position === index}
                onClick={() =>
                  setState((current) => selectSlide(current, position, count))
                }
              />
            ))}
          </div>
          <button
            type="button"
            className="autoplay-toggle"
            onClick={() => setPaused((current) => !current)}
            aria-label={t(paused ? "پخش خودکار" : "توقف پخش")}
            aria-pressed={paused}
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
        </>
      )}
    </div>
  );
}
export function HomeNews({ sections }: { sections: NewsSection[] }) {
  const { locale, t } = useLocale();
  const [type, setType] = useState("news");
  const selected = sections.find((section) => section.type === type);
  return (
    <div className="news-panel">
      <div className="news-filters" role="group" aria-label={t("نوع خبر")}>
        {["news", "announcement", "resolution"].map((key) => (
          <button
            key={key}
            className={key === type ? "selected" : ""}
            aria-pressed={key === type}
            onClick={() => setType(key)}
          >
            {sections.find((section) => section.type === key)?.title}
          </button>
        ))}
      </div>
      <div className="news-list">
        {selected?.items.map((item) => {
          const cover = mediaOf(item.cover);
          return (
            <Link
              prefetch={false}
              href={entityPath("news", item)}
              key={item.id}
              className={"news-item" + (cover ? "" : " without-image")}
            >
              {cover && (
                <img src={mediaUrl({ id: cover.id })} alt="" loading="lazy" />
              )}
              <span className="news-copy">
                <span className="news-meta">
                  <span className="news-category">{selected.title}</span>
                  <time>{localDate(item.published_at, locale)}</time>
                </span>
                <strong>{title(item)}</strong>
                <span className="news-excerpt">{text(item.excerpt)}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <Link
        prefetch={false}
        href={selected?.archive_path || "/news"}
        className="all-link hero-all"
      >
        {t("مشاهده همه")} {selected?.title}
        <ChevronLeft size={16} />
      </Link>
    </div>
  );
}
