import Link from "next/link";
import { FileText, ExternalLink, ChevronLeft } from "lucide-react";
import { Card, Empty } from "./common";
import { RichContent } from "./rich-content";
import {
  title,
  text,
  safeHref,
  entityPath,
  mediaUrl,
  mediaOf,
  date,
} from "@/lib/shared";
import type { Entity } from "@/lib/types";

export function PublicList({
  resource,
  items,
}: {
  resource: string;
  items: Entity[];
}) {
  if (!items.length) return <Empty />;
  if (resource === "faqs")
    return (
      <div className="faq-list">
        {items.map((item) => (
          <details key={item.id}>
            <summary>{title(item)}</summary>
            <RichContent html={text(item.answer)} />
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
              <a
                className="system-link"
                key={item.id}
                href={safeHref(item.url)!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={22} />
                {title(item)}
                <span>مشاهده سامانه ↗</span>
              </a>
            ),
        )}
      </div>
    );
  if (resource === "bank-accounts")
    return (
      <div className="cards-grid">
        {items.map((item) => (
          <article className="bank-card" key={item.id}>
            {item.is_demo && <span className="demo-label">حساب آزمایشی</span>}
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
                  <dt>{label}</dt>
                  <dd dir={key === "holder" ? "rtl" : "ltr"}>
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
                {item.issued_at && " · " + date(item.issued_at)}
              </p>
            </div>
            <ChevronLeft size={18} />
          </Link>
        ))}
      </div>
    );
  if (resource === "experts")
    return (
      <div className="cards-grid">
        {items.map((item) => {
          const photo = mediaOf(item.photo);
          return (
            <Link
              prefetch={false}
              href={entityPath(resource, item)}
              className={"expert-card" + (photo ? "" : " without-image")}
              key={item.id}
            >
              {photo && (
                <img
                  src={mediaUrl({ id: photo.id })}
                  alt={title(item)}
                  loading="lazy"
                />
              )}
              <h2>{title(item)}</h2>
              <p>{text(item.city)}</p>
              <p>شماره پروانه: {text(item.license_number)}</p>
              <span className="read-more">
                مشاهده پروفایل <ChevronLeft size={15} />
              </span>
            </Link>
          );
        })}
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
