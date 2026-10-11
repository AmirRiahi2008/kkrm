import Link from "@/components/localized-link";
import { publicApiUnavailable, serverApi } from "@/lib/api-server";
import { ApiError } from "@/lib/errors";
import { localDate, number } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n-server";
import {
  isPersonResource,
  mediaOf,
  mediaUrl,
  safeHref,
  text,
  title,
} from "@/lib/shared";
import type { Entity, Value } from "@/lib/types";
import { SectionTitle } from "./common";
import { GalleryViewer } from "./gallery-viewer";
import { PublicList } from "./public-list";
import { RichContent } from "./rich-content";
import { ShareButton } from "./share-button";
import { PublicUnavailable } from "./public-unavailable";
import { Suspense } from "react";

async function RelatedList({
  resource,
  path,
}: {
  resource: string;
  path: string;
}) {
  let items: Entity[];
  try {
    items = (await serverApi<Entity[]>(path)).data;
  } catch (error) {
    if (
      !publicApiUnavailable(error) &&
      !(error instanceof ApiError && error.status === 404)
    )
      throw error;
    return <PublicUnavailable compact />;
  }
  return <PublicList resource={resource} items={items} />;
}

export async function PublicDetail({
  resource,
  item,
}: {
  resource: string;
  item: Entity;
}) {
  const { locale, t } = await getTranslations();
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
  const object = (value: Value): Entity | null =>
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Entity)
      : null;
  const cover = isPersonResource(resource)
    ? mediaOf(item.photo) || mediaOf(item.image) || mediaOf(item.cover)
    : null;
  const imageSrc = cover ? mediaUrl({ id: cover.id }) : null;
  const body = text(
    item.body || item.biography || item.answer || item.description,
  );
  const files = [
    item.file,
    ...(Array.isArray(item.attachments) ? item.attachments : []),
  ].filter((file) => mediaOf(file));
  const discipline = object(item.discipline);
  const group = object(item.expert_group);
  const qualifications = Array.isArray(item.qualifications)
    ? item.qualifications
        .map(object)
        .filter((value): value is Entity => !!value)
    : [];
  const phone = text(item.phone)
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[^+\d]/g, "");
  return (
    <>
      <article
        className={
          "detail-panel" +
          (imageSrc ? "" : " without-image") +
          (resource === "experts" ? " expert-profile" : "")
        }
      >
        <div className="detail-meta">
          {resource === "experts" && (
            <span
              className={
                "directory-status" +
                (item.status === "suspended" ? " suspended" : "")
              }
            >
              {item.status === "suspended"
                ? locale === "en"
                  ? "Suspended license"
                  : "پروانه تعلیق‌شده"
                : locale === "en"
                  ? "Active expert"
                  : "کارشناس فعال"}
            </span>
          )}
          {item.published_at && (
            <time>{localDate(item.published_at, locale, true)}</time>
          )}
          {object(item.author) && (
            <span>
              {t("نویسنده:")} {title(object(item.author)!)}
            </span>
          )}
          {item.is_demo && (
            <span className="demo-label">{t("داده آزمایشی")}</span>
          )}
        </div>
        {imageSrc && (
          <img
            className="detail-cover portrait"
            src={imageSrc}
            alt={title(item)}
          />
        )}
        {resource === "events" && (
          <div className="event-info">
            <p>
              {t("شروع:")} {localDate(item.starts_at, locale, true)}
            </p>
            <p>
              {t("پایان:")} {localDate(item.ends_at, locale, true)}
            </p>
            <p>
              {item.mode === "online"
                ? t("مجازی")
                : item.mode === "hybrid"
                  ? t("حضوری و مجازی")
                  : t("حضوری")}{" "}
              · {text(item.location)}
            </p>
            {safeHref(item.registration_url) && (
              <a
                className="primary-button"
                href={safeHref(item.registration_url)!}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("ورود به سامانه رویداد")}
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
                      <dt>{t(label)}</dt>
                      <dd>
                        {key === "phone" && phone ? (
                          <a href={"tel:" + phone} dir="ltr">
                            {text(item[key])}
                          </a>
                        ) : key === "email" ? (
                          <a
                            href={
                              "mailto:" + encodeURIComponent(text(item[key]))
                            }
                            dir="ltr"
                          >
                            {text(item[key])}
                          </a>
                        ) : (
                          text(item[key])
                        )}
                      </dd>
                    </div>
                  ),
              )}
            </dl>
            <div className="expert-profile-specialty">
              {group && (
                <p>
                  {t("گروه:")}{" "}
                  <Link
                    href={"/experts?expert_group_id=" + group.id}
                    prefetch={false}
                  >
                    {title(group)}
                  </Link>
                </p>
              )}
              {discipline && (
                <p>
                  {t("رشته:")}{" "}
                  <Link
                    href={"/experts?discipline_id=" + discipline.id}
                    prefetch={false}
                  >
                    {title(discipline)}
                  </Link>
                </p>
              )}
            </div>
            {qualifications.length > 0 && (
              <>
                <h2>{t("صلاحیت‌ها")}</h2>
                <ul className="qualification-list">
                  {qualifications.map((qualification) => (
                    <li key={qualification.id}>{title(qualification)}</li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        {locale === "en" && body && item.body_locale === "fa" && (
          <p className="translation-notice">
            {t("محتوای این صفحه هنوز ترجمه نشده است.")}
          </p>
        )}
        <div
          className="content-original"
          lang={text(item.body_locale) || locale}
          dir={item.body_locale === "fa" ? "rtl" : undefined}
        >
          <RichContent html={body} />
        </div>
        {item.partner && (
          <p className="quiet">
            {t("طرف قرارداد:")} {text(item.partner)}
          </p>
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
            <h2>{t("فایل‌های پیوست")}</h2>
            {files.map((file, i) => (
              <a
                key={i}
                href={mediaUrl(file)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("دریافت")}{" "}
                {mediaOf(file)?.alt ||
                  t("فایل پیوست") + " " + number(i + 1, locale)}{" "}
                ↗
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
            {t("مشاهده منبع اصلی ↗")}
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
            title={t(relatedLabel)}
            href={"/" + relatedResource + "?" + query}
          />
          <Suspense
            fallback={
              <p className="quiet" role="status">
                {t("در حال دریافت اطلاعات…")}
              </p>
            }
          >
            <RelatedList
              resource={relatedResource}
              path={
                "/api/v1/" +
                (relatedResource === "news" ? "posts" : relatedResource) +
                "?" +
                query +
                "&per_page=50"
              }
            />
          </Suspense>
        </section>
      )}
    </>
  );
}
