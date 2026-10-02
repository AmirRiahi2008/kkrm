"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  LoaderCircle,
} from "lucide-react";
import {
  date,
  entityPath,
  mediaUrl,
  mediaOf,
  faNumber,
  safeHref,
  title,
  text,
} from "@/lib/shared";
import type { Entity, NewsSection } from "@/lib/types";
import "@/app/hero-slider.css";

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
      className="hero-slide"
      hidden={!active}
      role="group"
      aria-roledescription="اسلاید"
      aria-label={"اسلاید " + faNumber(position + 1) + " از " + faNumber(count)}
      aria-busy={active && !!src && status === "loading"}
    >
      {requested && src && (
        <img
          ref={imageRef}
          src={src}
          alt={title(item)}
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
          <span>در حال دریافت تصویر…</span>
        </div>
      )}
      {active && (!src || status === "error") && (
        <div className="hero-image-status">
          <span>
            {src ? "تصویر این اسلاید دریافت نشد." : "این اسلاید تصویری ندارد."}
          </span>
        </div>
      )}
      <div className="hero-caption">
        <h1>{title(item)}</h1>
        {href && (
          <Link prefetch={false} className="hero-details" href={href}>
            مشاهده جزئیات <ChevronLeft size={17} />
          </Link>
        )}
      </div>
    </article>
  );
}

export function Hero({
  slides,
  featured,
}: {
  slides: Entity[];
  featured: Entity[];
}) {
  const data = slides.length ? slides : featured;
  const [state, setState] = useState<CarouselState>(() =>
    selectSlide({ index: 0, requested: [] }, 0, data.length),
  );
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const index = data.length ? state.index % data.length : 0;
  const move = useCallback(
    (delta: number) => {
      setState((current) =>
        selectSlide(current, current.index + delta, data.length),
      );
    },
    [data.length],
  );
  useEffect(() => {
    if (
      paused ||
      hovered ||
      data.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = window.setInterval(() => {
      if (!document.hidden) move(1);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused, hovered, data.length, index, move]);
  if (!data.length)
    return (
      <div className="hero-carousel">
        <img
          className="hero-fallback"
          src="/assets/hero-meeting.png"
          alt="کانون کارشناسان رسمی دادگستری مازندران"
        />
      </div>
    );
  return (
    <div
      className="hero-carousel hero-fast"
      role="region"
      aria-roledescription="اسلایدر"
      aria-label="اسلایدر اخبار کانون"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(-1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(1);
        }
      }}
    >
      {data.map((item, position) => {
        const cover = mediaOf(item.image) || mediaOf(item.cover);
        const src = cover ? mediaUrl({ id: cover.id }) : "";
        const active = position === index;
        const neighbor =
          position === (index + 1) % data.length ||
          position === (index + data.length - 1) % data.length;
        const href = slides.length
          ? safeHref(item.target_url)
          : entityPath("news", item);
        return (
          <HeroFrame
            key={
              (slides.length ? "slide" : "post") +
              "-" +
              item.id +
              "-" +
              position +
              "-" +
              src
            }
            item={item}
            active={active}
            requested={active || neighbor || state.requested.includes(position)}
            src={src}
            href={href}
            position={position}
            count={data.length}
          />
        );
      })}
      {data.length > 1 && (
        <>
          <button
            type="button"
            className="hero-prev"
            aria-label="اسلاید قبلی"
            title="اسلاید قبلی"
            onClick={() => move(-1)}
          >
            <ChevronRight />
          </button>
          <button
            type="button"
            className="hero-next"
            aria-label="اسلاید بعدی"
            title="اسلاید بعدی"
            onClick={() => move(1)}
          >
            <ChevronLeft />
          </button>
          <div className="hero-dots" role="group" aria-label="انتخاب اسلاید">
            {data.map((item, position) => (
              <button
                type="button"
                key={item.id + "-" + position}
                aria-label={"اسلاید " + faNumber(position + 1)}
                aria-pressed={position === index}
                onClick={() =>
                  setState((current) =>
                    selectSlide(current, position, data.length),
                  )
                }
              />
            ))}
          </div>
          <button
            type="button"
            className="autoplay-toggle"
            onClick={() => setPaused((current) => !current)}
            aria-label={paused ? "پخش خودکار" : "توقف پخش"}
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
  const [type, setType] = useState("news");
  const selected = sections.find((section) => section.type === type);
  return (
    <div className="news-panel">
      <div className="news-filters" role="group" aria-label="نوع خبر">
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
                  <time>{date(item.published_at)}</time>
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
        مشاهده همه {selected?.title}
        <ChevronLeft size={16} />
      </Link>
    </div>
  );
}
