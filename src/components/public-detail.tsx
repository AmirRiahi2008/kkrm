import Link from "next/link";
import { RichContent } from "./rich-content";
import { GalleryViewer } from "./gallery-viewer";
import { PublicList } from "./public-list";
import { SectionTitle } from "./common";
import { ShareButton } from "./share-button";
import { serverApi } from "@/lib/api-server";
import { title, text, mediaUrl, mediaOf, safeHref, date } from "@/lib/shared";
import type { Entity, Value } from "@/lib/types";

export async function PublicDetail({
  resource,
  item,
}: {
  resource: string;
  item: Entity;
}) {
  let related: Entity[] = [];
  let relatedResource = "";
  let relatedLabel = "";
  let query = "";
  if (resource === "expert-groups") {
    relatedResource = "disciplines";
    relatedLabel = "رشته‌های این گروه";
    query = "expert_group_id=" + item.id;
  }
  if (resource === "disciplines") {
    relatedResource = "qualifications";
    relatedLabel = "صلاحیت‌های این رشته";
    query = "discipline_id=" + item.id;
  }
  if (resource === "board-terms") {
    relatedResource = "board-members";
    relatedLabel = "اعضای این دوره";
    query = "board_term_id=" + item.id;
  }
  if (resource === "categories" || resource === "tags") {
    relatedResource = "news";
    relatedLabel = "مطالب مرتبط";
    query =
      (resource === "tags" ? "tag" : "category") +
      "=" +
      encodeURIComponent(text(item.slug));
  }
  if (relatedResource)
    related = (
      await serverApi<Entity[]>(
        "/api/v1/" +
          (relatedResource === "news" ? "posts" : relatedResource) +
          "?" +
          query +
          "&per_page=50",
      )
    ).data;
  const object = (value: Value): Entity | null =>
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Entity)
      : null;
  const cover =
    mediaOf(item.cover) || mediaOf(item.photo) || mediaOf(item.image);
  const imageSrc = cover ? mediaUrl({ id: cover.id }) : null;
  const files = [
    item.file,
    ...(Array.isArray(item.attachments) ? item.attachments : []),
  ].filter((file) => mediaOf(file));
  return (
    <>
      <article className={"detail-panel" + (imageSrc ? "" : " without-image")}>
        <div className="detail-meta">
          {item.published_at && <time>{date(item.published_at, true)}</time>}
          {object(item.author) && (
            <span>نویسنده: {title(object(item.author)!)}</span>
          )}
          {item.is_demo && <span className="demo-label">داده آزمایشی</span>}
        </div>
        {resource !== "albums" && imageSrc && (
          <img
            className={
              "detail-cover" + (mediaOf(item.photo) ? " portrait" : "")
            }
            src={imageSrc}
            alt={title(item)}
          />
        )}
        {resource === "events" && (
          <div className="event-info">
            <p>شروع: {date(item.starts_at, true)}</p>
            <p>پایان: {date(item.ends_at, true)}</p>
            <p>
              {item.mode === "online"
                ? "مجازی"
                : item.mode === "hybrid"
                  ? "حضوری و مجازی"
                  : "حضوری"}{" "}
              · {text(item.location)}
            </p>
            {safeHref(item.registration_url) && (
              <a
                className="primary-button"
                href={safeHref(item.registration_url)!}
                target="_blank"
                rel="noopener noreferrer"
              >
                ورود به سامانه رویداد
              </a>
            )}
          </div>
        )}
        {resource === "experts" && (
          <>
            <dl className="profile-details">
              {[
                ["license_number", "شماره پروانه"],
                ["city", "شهر"],
                ["geographical_scope", "حوزه جغرافیایی"],
                ["phone", "تلفن"],
                ["email", "ایمیل"],
              ].map(
                ([key, label]) =>
                  item[key] && (
                    <div key={key}>
                      <dt>{label}</dt>
                      <dd>{text(item[key])}</dd>
                    </div>
                  ),
              )}
            </dl>
            <p>رشته: {text(object(item.discipline)?.name)}</p>
            <p>گروه: {text(object(item.expert_group)?.name)}</p>
            <h2>صلاحیت‌ها</h2>
            <ul className="qualification-list">
              {Array.isArray(item.qualifications) &&
                item.qualifications.map((value, i) => (
                  <li key={i}>{text(object(value)?.title)}</li>
                ))}
            </ul>
          </>
        )}
        <RichContent
          html={text(
            item.body || item.biography || item.answer || item.description,
          )}
        />
        {item.partner && (
          <p className="quiet">طرف قرارداد: {text(item.partner)}</p>
        )}
        {resource === "albums" && (
          <GalleryViewer
            items={
              Array.isArray(item.items)
                ? (item.items as unknown as Entity[])
                : []
            }
          />
        )}
        {files.length > 0 && (
          <div className="attachments">
            <h2>فایل‌های پیوست</h2>
            {files.map((file, i) => (
              <a
                key={i}
                href={mediaUrl(file)}
                target="_blank"
                rel="noopener noreferrer"
              >
                دریافت {mediaOf(file)?.alt || "فایل پیوست " + (i + 1)} ↗
              </a>
            ))}
          </div>
        )}
        {safeHref(item.source_url) && (
          <a
            className="source-link"
            href={safeHref(item.source_url)!}
            target="_blank"
            rel="noopener noreferrer"
          >
            مشاهده منبع اصلی ↗
          </a>
        )}
        {Array.isArray(item.tags) && (
          <div className="tag-list">
            {item.tags.map((value) => {
              const tag = object(value);
              return (
                tag && (
                  <Link
                    prefetch={false}
                    key={tag.id}
                    href={"/news?tag=" + encodeURIComponent(text(tag.slug))}
                  >
                    {title(tag)}
                  </Link>
                )
              );
            })}
          </div>
        )}
        <div className="detail-actions">
          <ShareButton title={title(item)} />
        </div>
      </article>
      {relatedResource && (
        <section className="home-section">
          <SectionTitle
            title={relatedLabel}
            href={"/" + relatedResource + "?" + query}
          />
          <PublicList resource={relatedResource} items={related} />
        </section>
      )}
    </>
  );
}
