"use client";

import { entityPath, mediaOf, mediaUrl, text, title } from "@/lib/shared";
import type { Entity, Value } from "@/lib/types";
import {
  ArrowUpRight,
  BadgeCheck,
  Mail,
  MapPin,
  Phone,
  UsersRound,
} from "lucide-react";
import { useLocale } from "./locale-provider";
import Link from "./localized-link";

function entity(value: Value): Entity | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Entity)
    : null;
}

export function ExpertCard({ item }: { item: Entity }) {
  const { locale, t } = useLocale();
  const photo = mediaOf(item.photo);
  const group = entity(item.expert_group);
  const discipline = entity(item.discipline);
  const qualifications = Array.isArray(item.qualifications)
    ? item.qualifications
        .map(entity)
        .filter((value): value is Entity => !!value)
    : [];
  const phone = text(item.phone);
  const dial = phone
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[^+\d]/g, "");
  const email = text(item.email);
  const suspended = item.status === "suspended";
  return (
    <article
      className={"directory-expert-card" + (!photo ? " without-image" : "")}
    >
      <Link
        href={entityPath("experts", item)}
        prefetch={false}
        className="directory-expert-main"
      >
        <div className="directory-expert-heading">
          {photo && (
            <img
              src={mediaUrl({ id: photo.id })}
              alt={title(item)}
              width={78}
              height={94}
              loading="lazy"
            />
          )}
          <div>
            <span
              className={"directory-status" + (suspended ? " suspended" : "")}
            >
              <BadgeCheck size={13} />
              {suspended
                ? locale === "en"
                  ? "Suspended"
                  : "تعلیق‌شده"
                : locale === "en"
                  ? "Active expert"
                  : "کارشناس فعال"}
            </span>
            <h2>{title(item)}</h2>
            <p>
              {locale === "en" ? "License no." : "شماره پروانه"}:{" "}
              <b dir="ltr">{text(item.license_number) || "—"}</b>
            </p>
          </div>
        </div>
        <dl className="directory-expert-facts">
          <div>
            <dt>
              <UsersRound size={14} />
              {t("گروه")}
            </dt>
            <dd>{group ? title(group) : "—"}</dd>
          </div>
          <div>
            <dt>{t("رشته")}</dt>
            <dd>{discipline ? title(discipline) : "—"}</dd>
          </div>
          <div>
            <dt>
              <MapPin size={14} />
              {t("شهر")}
            </dt>
            <dd>{text(item.city) || "—"}</dd>
          </div>
        </dl>
        {qualifications.length > 0 && (
          <div className="directory-qualification-tags">
            {qualifications.slice(0, 3).map((qualification) => (
              <span key={qualification.id}>{title(qualification)}</span>
            ))}
            {qualifications.length > 3 && (
              <span>
                +
                {new Intl.NumberFormat(locale === "en" ? "en" : "fa").format(
                  qualifications.length - 3,
                )}
              </span>
            )}
          </div>
        )}
        <span className="read-more">
          {t("مشاهده پروفایل")}
          <ArrowUpRight size={15} />
        </span>
      </Link>
      {(phone || email) && (
        <div className="directory-contact-links">
          {phone && (
            <a href={"tel:" + dial}>
              <Phone size={14} />
              <span dir="ltr">{phone}</span>
            </a>
          )}
          {email && (
            <a href={"mailto:" + encodeURIComponent(email)}>
              <Mail size={14} />
              <span>{locale === "en" ? "Email" : "ایمیل"}</span>
            </a>
          )}
        </div>
      )}
    </article>
  );
}
