"use client";

import "@/app/no-image.css";
import { useLocale } from "@/components/locale-provider";
import Link from "@/components/localized-link";
import { localDate, number } from "@/lib/i18n";
import { entityPath, mediaOf, mediaUrl, text, title } from "@/lib/shared";
import type { Entity, Pagination } from "@/lib/types";
import { ChevronLeft } from "lucide-react";
import { BoardContact } from "./board-contact";

export function SectionTitle({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  const { t } = useLocale();
  return (
    <div className="section-title">
      <h2>{t(title)}</h2>
      {href && (
        <Link prefetch={false} href={href} className="all-link">
          {t("مشاهده همه")}
          <ChevronLeft size={16} />
        </Link>
      )}
    </div>
  );
}
export function PageTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const { t } = useLocale();
  return (
    <div className="page-title">
      <Link prefetch={false} href="/">
        {t("صفحه اصلی")}
      </Link>
      <span> / </span>
      <span>{t(title)}</span>
      <h1>{t(title)}</h1>
      {description && <p>{t(description)}</p>}
    </div>
  );
}
export function Card({
  item,
  resource = "news",
}: {
  item: Entity;
  resource?: string;
}) {
  const { locale, t } = useLocale();
  const cover =
    mediaOf(item.cover) || mediaOf(item.photo) || mediaOf(item.image);
  const imageSrc = cover ? mediaUrl({ id: cover.id }) : null;
  const publishedAt = item.published_at || item.event_date || item.starts_at;
  const publishedDate = publishedAt ? localDate(publishedAt, locale) : "";
  const excerpt = text(
    item.excerpt || item.description || item.partner || item.position,
  );
  const className = [
    "content-card",
    resource === "albums" ? "album-card" : "",
    imageSrc ? "" : "without-image",
    resource === "board-members" ? "board-member-card" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      {imageSrc && (
        <div className="card-image">
          <img src={imageSrc} alt={title(item)} loading="lazy" />
          {resource === "albums" && (
            <span className="image-label">{t("آلبوم تصاویر")}</span>
          )}
        </div>
      )}
      <div className="card-copy">
        {publishedDate && publishedDate !== "—" && <time>{publishedDate}</time>}
        <h3>{title(item)}</h3>
        {excerpt && <p>{excerpt}</p>}
        <span className="read-more">
          {t("مشاهده جزئیات")}
          <ChevronLeft size={16} />
        </span>
      </div>
    </>
  );
  if (resource === "board-members") {
    return (
      <article className={className}>
        <Link
          prefetch={false}
          href={entityPath(resource, item)}
          className="board-member-main"
        >
          {content}
        </Link>
        <BoardContact item={item} />
      </article>
    );
  }
  return (
    <Link
      prefetch={false}
      href={entityPath(resource, item)}
      className={className}
    >
      {content}
    </Link>
  );
}
export function Empty({
  message = "موردی برای نمایش وجود ندارد.",
}: {
  message?: string;
}) {
  const { t } = useLocale();
  return (
    <div className="empty-state">
      <span>◇</span>
      <p>{t(message)}</p>
    </div>
  );
}
export function Pages({
  pagination,
  path,
  query,
}: {
  pagination?: Pagination;
  path: string;
  query: URLSearchParams;
}) {
  const { locale, t } = useLocale();
  if (!pagination || pagination.last_page <= 1) return null;
  const href = (page: number) => {
    const next = new URLSearchParams(query);
    next.set("page", String(page));
    return path + "?" + next;
  };
  const low = Math.max(1, pagination.page - 2);
  const high = Math.min(pagination.last_page, pagination.page + 2);
  return (
    <nav className="pagination" aria-label={t("صفحه‌بندی")}>
      {pagination.page > 1 && (
        <Link prefetch={false} href={href(pagination.page - 1)}>
          {t("قبلی")}
        </Link>
      )}
      {Array.from({ length: high - low + 1 }, (_, i) => low + i).map((page) => (
        <Link
          prefetch={false}
          key={page}
          href={href(page)}
          aria-current={page === pagination.page ? "page" : undefined}
        >
          {number(page, locale)}
        </Link>
      ))}
      {pagination.page < pagination.last_page && (
        <Link prefetch={false} href={href(pagination.page + 1)}>
          {t("بعدی")}
        </Link>
      )}
    </nav>
  );
}
