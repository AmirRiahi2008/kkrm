import { ExternalLink } from "lucide-react";
import { safeHref, text, title } from "@/lib/shared";
import type { Entity } from "@/lib/types";
import "@/app/board-contact.css";

export function BoardContact({ item }: { item: Entity }) {
  const href = safeHref(item.contact_url);
  if (!href || !/^https?:\/\//i.test(href)) return null;
  const label = text(item.contact_label).trim() || "راه ارتباطی";

  return (
    <a
      className="board-contact-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label + "؛ ارتباط با " + title(item)}
    >
      {label}
      <ExternalLink size={16} aria-hidden="true" />
    </a>
  );
}
