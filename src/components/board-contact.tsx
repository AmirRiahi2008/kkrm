"use client";

import "@/app/board-contact.css";
import { useLocale } from "@/components/locale-provider";
import { safeHref, text, title } from "@/lib/shared";
import type { Entity } from "@/lib/types";
import { ExternalLink } from "lucide-react";

export function BoardContact({ item }: { item: Entity }) {
  const { t } = useLocale();
  const href = safeHref(item.contact_url);
  if (!href || !/^https?:\/\//i.test(href)) return null;
  const label = text(item.contact_label).trim() || t("راه ارتباطی");

  return (
    <a
      className="board-contact-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label + " · " + title(item)}
    >
      {t(label)}
      <ExternalLink size={16} aria-hidden="true" />
    </a>
  );
}
