import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  entityPath,
  title,
  mediaUrl,
  mediaOf,
  date,
  text,
  faNumber,

} from "@/lib/shared";
import type { Entity, Pagination } from "@/lib/types";

export function SectionTitle({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="section-title">
      <h2>{title}</h2>

      {href && (
        <Link
          prefetch={false}
          href={href}
          className="all-link"
        >
          مشاهده همه
          <ChevronLeft size={16} aria-hidden="true" />
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
  return (
    <div className="page-title">
      <Link prefetch={false} href="/">
        صفحه اصلی
      </Link>

      <span> / </span>
      <span>{title}</span>
      <h1>{title}</h1>

      {description && <p>{description}</p>}
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
  const person = isPersonResource(resource);

  const cover = person
    ? mediaOf(item.photo)
    : mediaOf(item.cover) || mediaOf(item.image);

  const imageSrc = cover
    ? mediaUrl({ id: cover.id })
    : person
      ? DEFAULT_PERSON_IMAGE
      : null;

  const itemTitle = title(item);

  const publishedAt =
    item.published_at || item.event_date || item.starts_at;

  const publishedDate = publishedAt
    ? date(publishedAt)
    : null;

  const excerpt = text(
    item.excerpt ||
      item.description ||
      item.partner ||
      item.position,
  );

  const albumLabel = "آلبوم تصاویر";

  const className = [
    "content-card",
    resource === "albums" ? "album-card" : "",
    person ? "person-card" : "",
    imageSrc ? "" : "without-image",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      prefetch={false}
      href={entityPath(resource, item)}
      className={className}
    >
      {imageSrc && (
        <div className="card-image">
          <img
            src={imageSrc}
            alt={itemTitle}
            loading="lazy"
          />

          {resource === "albums" && (
            <span className="image-label">
              {albumLabel}
            </span>
          )}
        </div>
      )}

      <div className="card-copy">
        {!imageSrc && resource === "albums" && (
          <span className="quiet">{albumLabel}</span>
        )}

        {publishedDate && publishedDate !== "—" && (
          <time>{publishedDate}</time>
        )}

        <h3>{itemTitle}</h3>

        {excerpt && <p>{excerpt}</p>}

        <span className="read-more">
          مشاهده جزئیات
          <ChevronLeft size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export function Empty({
  message = "موردی برای نمایش وجود ندارد.",
}: {
  message?: string;
}) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">◇</span>
      <p>{message}</p>
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
  if (!pagination || pagination.last_page <= 1) {
    return null;
  }

  const href = (page: number) => {
    const next = new URLSearchParams(query);
    next.set("page", String(page));

    return `${path}?${next.toString()}`;
  };

  const low = Math.max(1, pagination.page - 2);
  const high = Math.min(
    pagination.last_page,
    pagination.page + 2,
  );

  const pages = Array.from(
    { length: Math.max(0, high - low + 1) },
    (_, index) => low + index,
  );

  return (
    <nav className="pagination" aria-label="صفحه‌بندی">
      {pagination.page > 1 && (
        <Link
          prefetch={false}
          href={href(pagination.page - 1)}
          aria-label="صفحه قبلی"
        >
          قبلی
        </Link>
      )}

      {pages.map((page) => (
        <Link
          prefetch={false}
          key={page}
          href={href(page)}
          aria-label={`صفحه ${faNumber(page)}`}
          aria-current={
            page === pagination.page ? "page" : undefined
          }
        >
          {faNumber(page)}
        </Link>
      ))}

      {pagination.page < pagination.last_page && (
        <Link
          prefetch={false}
          href={href(pagination.page + 1)}
          aria-label="صفحه بعدی"
        >
          بعدی
        </Link>
      )}
    </nav>
  );
}