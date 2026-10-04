import Link from "next/link";
import { RichContent } from "./rich-content";
import { GalleryViewer } from "./gallery-viewer";
import { PublicList } from "./public-list";
import { SectionTitle } from "./common";
import { ShareButton } from "./share-button";
import { serverApi } from "@/lib/api-server";
import {
  title,
  text,
  mediaUrl,
  mediaOf,
  safeHref,
  date,
  DEFAULT_PERSON_IMAGE,
  isPersonResource,
} from "@/lib/shared";
import type { Entity, Value } from "@/lib/types";

function object(value: Value): Entity | null {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Entity;
  }

  return null;
}

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

  if (relatedResource) {
    const response = await serverApi<Entity[]>(
      "/api/v1/" +
        (relatedResource === "news" ? "posts" : relatedResource) +
        "?" +
        query +
        "&per_page=50",
    );

    related = response.data;
  }

  const person = isPersonResource(resource);
  const itemTitle = title(item);

  const detailMedia = person
    ? mediaOf(item.photo)
    : mediaOf(item.cover) || mediaOf(item.image);

  const detailImageSrc = detailMedia
    ? mediaUrl({ id: detailMedia.id })
    : person
      ? DEFAULT_PERSON_IMAGE
      : null;

  const author = object(item.author);
  const authorName = author ? title(author) : "";
  const publishedDate = item.published_at
    ? date(item.published_at, true)
    : null;

  const registrationUrl = safeHref(item.registration_url);
  const sourceUrl = safeHref(item.source_url);
  const partner = text(item.partner);
  const location = text(item.location);

  const discipline = object(item.discipline);
  const expertGroup = object(item.expert_group);

  const qualifications = Array.isArray(item.qualifications)
    ? item.qualifications
        .map((value) => object(value))
        .filter((value): value is Entity => value !== null)
    : [];

  const galleryItems = Array.isArray(item.items)
    ? item.items
        .map((value) => object(value))
        .filter((value): value is Entity => value !== null)
    : [];

  const tags = Array.isArray(item.tags)
    ? item.tags
        .map((value) => object(value))
        .filter((value): value is Entity => value !== null)
    : [];

  const fileValues = [
    item.file,
    ...(Array.isArray(item.attachments) ? item.attachments : []),
  ];

  const files = fileValues.flatMap((value) => {
    const media = mediaOf(value);
    return media ? [media] : [];
  });

  const profileFields = [
    ["license_number", "شماره پروانه"],
    ["city", "شهر"],
    ["geographical_scope", "حوزه جغرافیایی"],
    ["phone", "تلفن"],
    ["email", "ایمیل"],
  ];

  return (
    <>
      <article className="detail-panel">
        <ShareButton title={itemTitle} />

        <div className="detail-meta">
          {publishedDate && publishedDate !== "—" && (
            <time>{publishedDate}</time>
          )}

          {authorName && (
            <span>نویسنده: {authorName}</span>
          )}

          {item.is_demo === true && (
            <span className="demo-label">داده آزمایشی</span>
          )}
        </div>

        {resource !== "albums" && detailImageSrc && (
          <img
            className={`detail-cover${person ? " portrait" : ""}`}
            src={detailImageSrc}
            alt={itemTitle}
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
                  : "حضوری"}
              {location && ` · ${location}`}
            </p>

            {registrationUrl && (
              <a
                className="primary-button"
                href={registrationUrl}
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
              {profileFields.map(([key, label]) => {
                const value = text(item[key]);

                if (!value) return null;

                return (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                );
              })}
            </dl>

            {discipline && text(discipline.name) && (
              <p>رشته: {text(discipline.name)}</p>
            )}

            {expertGroup && text(expertGroup.name) && (
              <p>گروه: {text(expertGroup.name)}</p>
            )}

            {qualifications.length > 0 && (
              <>
                <h2>صلاحیت‌ها</h2>

                <ul className="qualification-list">
                  {qualifications.map((qualification, index) => (
                    <li key={qualification.id ?? index}>
                      {title(qualification)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}

        <RichContent
          html={text(
            item.body ||
              item.biography ||
              item.answer ||
              item.description,
          )}
        />

        {partner && (
          <p className="quiet">طرف قرارداد: {partner}</p>
        )}

        {resource === "albums" && (
          <GalleryViewer items={galleryItems} />
        )}

        {files.length > 0 && (
          <div className="attachments">
            <h2>فایل‌های پیوست</h2>

            {files.map((file, index) => (
              <a
                key={`${file.id}-${index}`}
                href={mediaUrl({ id: file.id })}
                target="_blank"
                rel="noopener noreferrer"
              >
                دریافت {file.alt || `فایل پیوست ${index + 1}`} ↗
              </a>
            ))}
          </div>
        )}

        {sourceUrl && (
          <a
            className="source-link"
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            مشاهده منبع اصلی ↗
          </a>
        )}

        {tags.length > 0 && (
          <div className="tag-list">
            {tags.map((tag) => (
              <Link
                prefetch={false}
                key={tag.id}
                href={
                  "/news?tag=" +
                  encodeURIComponent(text(tag.slug))
                }
              >
                {title(tag)}
              </Link>
            ))}
          </div>
        )}
      </article>

      {relatedResource && (
        <section className="home-section">
          <SectionTitle
            title={relatedLabel}
            href={`/${relatedResource}?${query}`}
          />

          <PublicList
            resource={relatedResource}
            items={related}
          />
        </section>
      )}
    </>
  );
}