import Link from "./localized-link";
import { RichContent } from "./rich-content";
import { ShareButton } from "./share-button";
import { getTranslations } from "@/lib/i18n-server";
import { localDate } from "@/lib/i18n";
import { entityPath, text, title } from "@/lib/shared";
import type { Entity } from "@/lib/types";
import { ArrowRight, CalendarDays, ChevronLeft, FileText } from "lucide-react";
import "@/app/cms-page.css";

export async function CmsPage({
  item,
  preview = false,
}: {
  item: Entity;
  preview?: boolean;
}) {
  const { locale, t } = await getTranslations();
  const english = locale === "en";
  const updated = localDate(item.updated_at || item.created_at, locale);
  const bodyLocale = item.body_locale === "fa" ? "fa" : locale;
  const labels = english
    ? { page: "Council page", updated: "Last updated", back: "Back to home" }
    : {
        page: "صفحه کانون",
        updated: "آخرین به‌روزرسانی",
        back: "بازگشت به صفحه اصلی",
      };

  return (
    <div className="cms-page-root page-container">
      <nav
        className="cms-page-breadcrumb"
        aria-label={english ? "Breadcrumb" : "مسیر صفحه"}
      >
        <Link href="/" prefetch={false}>
          {t("صفحه اصلی")}
        </Link>
        <ChevronLeft size={15} aria-hidden="true" />
        <span aria-current="page">{title(item)}</span>
      </nav>
      <article className="cms-page-card">
        <header className="cms-page-heading">
          <span className="cms-page-eyebrow">
            <FileText size={16} aria-hidden="true" />
            {labels.page}
          </span>
          <h1 lang={text(item.content_locale) || locale}>{title(item)}</h1>
          {text(item.summary) && (
            <p className="cms-page-intro">{text(item.summary)}</p>
          )}
          <div className="cms-page-meta">
            {updated && updated !== "—" && (
              <span>
                <CalendarDays size={16} aria-hidden="true" />
                {labels.updated}: <time>{updated}</time>
              </span>
            )}
            {!preview && (
              <ShareButton
                title={title(item)}
                url={entityPath("pages", item)}
              />
            )}
          </div>
        </header>
        <div
          className="cms-page-body"
          lang={bodyLocale}
          dir={bodyLocale === "en" ? "ltr" : "rtl"}
        >
          <RichContent html={text(item.body)} />
        </div>
        <footer className="cms-page-end">
          <Link href="/" prefetch={false}>
            <ArrowRight size={17} aria-hidden="true" />
            {labels.back}
          </Link>
          {!preview && (
            <span>
              {english
                ? "Mazandaran Official Justice Experts Council"
                : "کانون کارشناسان رسمی دادگستری مازندران"}
            </span>
          )}
        </footer>
      </article>
    </div>
  );
}
