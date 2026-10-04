"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import {
  date,
  entityPath,
  mediaUrl,
  safeHref,
  title,
  text,
} from "@/lib/shared";
import type { Entity, NewsSection } from "@/lib/types";

export function Hero({
  slides,
  featured,
}: {
  slides: Entity[];
  featured: Entity[];
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const data = slides.length ? slides : featured;
  useEffect(() => {
    if (
      paused ||
      hovered ||
      data.length < 2 ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % data.length),
      6000,
    );
    return () => clearInterval(timer);
  }, [paused, hovered, data.length]);
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
  const item = data[index % data.length];
  const href = slides.length
    ? safeHref(item.target_url)
    : entityPath("news", item);
  return (
    <div
      className="hero-carousel"
      aria-roledescription="اسلایدر"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <article className="hero-slide">
        <img
          src={mediaUrl(item.image || item.cover)}
          alt={title(item)}
          fetchPriority="high"
        />
        <div className="hero-caption">
          <h1>{title(item)}</h1>
          {href && (
            <Link prefetch={false} className="hero-details" href={href}>
              مشاهده جزئیات <ChevronLeft size={17} />
            </Link>
          )}
        </div>
      </article>
      {data.length > 1 && (
        <>
          <button
            className="hero-next"
            aria-label="اسلاید بعدی"
            onClick={() => setIndex((index + 1) % data.length)}
          >
            <ChevronRight />
          </button>
          <button
            className="hero-prev"
            aria-label="اسلاید قبلی"
            onClick={() => setIndex((index + data.length - 1) % data.length)}
          >
            <ChevronLeft />
          </button>
          <div className="hero-dots">
            {data.map((_, i) => (
              <button
                key={i}
                aria-label={"اسلاید " + (i + 1)}
                aria-pressed={i === index}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button
            className="autoplay-toggle"
            onClick={() => setPaused(!paused)}
            aria-label={paused ? "پخش خودکار" : "توقف پخش"}
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
        {selected?.items.map((item) => (
          <Link
            prefetch={false}
            href={entityPath("news", item)}
            key={item.id}
            className="news-item"
          >
            <img src={mediaUrl(item.cover)} alt="" loading="lazy" />
            <span className="news-copy">
              <span className="news-meta">
                <span className="news-category">{selected.title}</span>
                <time>{date(item.published_at)}</time>
              </span>
              <strong>{title(item)}</strong>
              <span className="news-excerpt">{text(item.excerpt)}</span>
            </span>
          </Link>
        ))}
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
