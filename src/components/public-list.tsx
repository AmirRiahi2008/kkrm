import Link from "@/components/localized-link";
import { localDate } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n-server";
import { entityPath, safeHref, text, title } from "@/lib/shared";
import type { Entity } from "@/lib/types";
import { ChevronLeft, ExternalLink, FileText } from "lucide-react";
import { Card, Empty } from "./common";
import { RichContent } from "./rich-content";
import { ExpertCard } from "./expert-card";
import { PointerSystemLink } from "./pointer-system-link";
import "@/app/expert-directory.css";

export async function PublicList({
  resource,
  items,
}: {
  resource: string;
  items: Entity[];
}) {
  const { locale, t } = await getTranslations();
  if (!items.length) return <Empty />;
  if (resource === "faqs")
    return (
      <div className="faq-list">
        {items.map((item) => (
          <details key={item.id}>
            <summary>{title(item)}</summary>
            <div
              lang={item.body_locale === "fa" ? "fa" : undefined}
              dir={item.body_locale === "fa" ? "rtl" : undefined}
            >
              <RichContent html={text(item.answer)} />
            </div>
          </details>
        ))}
      </div>
    );
  if (resource === "systems" || resource === "links")
    return (
      <div className="systems-grid">
        {items.map(
          (item) =>
            safeHref(item.url) && (
              <PointerSystemLink
                className="system-link"
                key={item.id}
                href={safeHref(item.url)!}
                external
              >
                <ExternalLink size={22} />
                <strong>{title(item)}</strong>
                <span>{t("مشاهده سامانه ↗")}</span>
              </PointerSystemLink>
            ),
        )}
      </div>
    );
  if (resource === "bank-accounts")
    return (
      <div className="cards-grid">
        {items.map((item) => (
          <article className="bank-card" key={item.id}>
            {item.is_demo && (
              <span className="demo-label">{t("حساب آزمایشی")}</span>
            )}
            <h2>{title(item)}</h2>
            <p>{text(item.purpose)}</p>
            <dl>
              {[
                ["holder", "صاحب حساب"],
                ["account_number", "شماره حساب"],
                ["iban", "شبا"],
                ["card_number", "شماره کارت"],
              ].map(([key, label]) => (
                <div key={key}>
                  <dt>{t(label)}</dt>
                  <dd
                    dir={
                      key === "holder"
                        ? locale === "en"
                          ? "ltr"
                          : "rtl"
                        : "ltr"
                    }
                  >
                    {text(item[key]) || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    );
  if (
    [
      "documents",
      "qualifications",
      "disciplines",
      "expert-groups",
      "categories",
      "tags",
      "board-terms",
    ].includes(resource)
  )
    return (
      <div className="document-list">
        {items.map((item) => (
          <Link
            prefetch={false}
            className="document-row"
            key={item.id}
            href={entityPath(resource, item)}
          >
            <FileText size={27} />
            <div>
              <h2>{title(item)}</h2>
              <p>
                {text(item.description || item.code)}
                {item.issued_at && " · " + localDate(item.issued_at, locale)}
              </p>
            </div>
            <ChevronLeft size={18} />
          </Link>
        ))}
      </div>
    );
  if (resource === "experts")
    return (
      <div className="directory-expert-grid">
        {items.map((item) => (
          <ExpertCard key={item.id} item={item} />
        ))}
      </div>
    );
  return (
    <div className="cards-grid">
      {items.map((item) => (
        <Card key={item.id} item={item} resource={resource} />
      ))}
    </div>
  );
}
