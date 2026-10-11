"use client";

import "@/app/home-content-tabs.css";
import { number } from "@/lib/i18n";
import { safeHref } from "@/lib/shared";
import type { NewsSection } from "@/lib/types";
import {
  ArrowUpRight,
  BellRing,
  BookOpen,
  ClipboardCheck,
  HeartHandshake,
  Newspaper,
} from "lucide-react";
import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { Card, Empty } from "./common";
import { useLocale } from "./locale-provider";
import Link from "./localized-link";

const contentTabs = [
  {
    type: "announcement",
    label: "اطلاعیه‌های کانون",
    archive: "/news?type=announcement",
    icon: BellRing,
  },
  {
    type: "news",
    label: "اخبار کانون",
    archive: "/news?type=news",
    icon: Newspaper,
  },
  {
    type: "article",
    label: "مقاله‌ها",
    archive: "/articles",
    icon: BookOpen,
  },
  {
    type: "resolution",
    label: "مصوبات",
    archive: "/news?type=resolution",
    icon: ClipboardCheck,
  },
  {
    type: "welfare",
    label: "اخبار رفاهی",
    archive: "/news?type=welfare",
    icon: HeartHandshake,
  },
] as const;

type ContentType = (typeof contentTabs)[number]["type"];

export function HomeContentTabs({ sections }: { sections: NewsSection[] }) {
  const { locale, t } = useLocale();
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const sectionsByType = new Map(
    sections.map((section) => [section.type, section]),
  );
  const [activeType, setActiveType] = useState<ContentType>(() => {
    if (sectionsByType.get("news")?.items.length) return "news";
    return (
      contentTabs.find((tab) => sectionsByType.get(tab.type)?.items.length)
        ?.type || "news"
    );
  });
  const activeIndex = contentTabs.findIndex((tab) => tab.type === activeType);
  const selected = contentTabs[activeIndex];
  const currentItems = sectionsByType.get(activeType)?.items.slice(0, 3) || [];

  function selectTab(index: number, focus = false) {
    setActiveType(contentTabs[index].type);
    const button = buttons.current[index];
    if (focus) button?.focus({ preventScroll: true });
    button?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next: number;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = contentTabs.length - 1;
    else if (event.key === "ArrowRight")
      next = index + (locale === "en" ? 1 : -1);
    else if (event.key === "ArrowLeft")
      next = index + (locale === "en" ? -1 : 1);
    else return;
    event.preventDefault();
    selectTab((next + contentTabs.length) % contentTabs.length, true);
  }

  return (
    <section
      className="home-section page-container content-hub-section"
      aria-labelledby={`${id}-heading`}
    >
      <div className="content-hub" dir={locale === "en" ? "ltr" : "rtl"}>
        <header className="hub-heading">
          <div>
            <h2 id={`${id}-heading`}>{t("تازه‌های کانون")}</h2>
            <p>{t("اخبار، اطلاعیه‌ها و مطالب کانون را یک‌جا دنبال کنید.")}</p>
          </div>
        </header>
        <div className="hub-tabs-viewport">
          <div
            className="hub-tab-list"
            role="tablist"
            aria-label={t("نوع مطالب")}
            aria-orientation="horizontal"
            style={
              {
                "--active-index": activeIndex,
                "--tab-direction": locale === "en" ? 1 : -1,
              } as CSSProperties
            }
          >
            <span className="hub-tabs-indicator" aria-hidden="true" />
            {contentTabs.map((tab, index) => {
              const Icon = tab.icon;
              const active = tab.type === activeType;
              return (
                <button
                  key={tab.type}
                  ref={(element) => {
                    buttons.current[index] = element;
                  }}
                  className="hub-tab"
                  type="button"
                  role="tab"
                  id={`${id}-${tab.type}-tab`}
                  aria-controls={`${id}-${tab.type}-panel`}
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => selectTab(index)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                >
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  <span>{t(tab.label)}</span>
                </button>
              );
            })}
          </div>
        </div>
        <p
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {locale === "en"
            ? `${t(selected.label)}: ${currentItems.length} ${currentItems.length === 1 ? "item" : "items"} shown.`
            : `${t(selected.label)}؛ ${number(currentItems.length, locale)} مطلب برای نمایش.`}
        </p>
        {contentTabs.map((tab) => {
          const active = tab.type === activeType;
          const section = sectionsByType.get(tab.type);
          const items = section?.items.slice(0, 3) || [];
          const archive = safeHref(section?.archive_path) || tab.archive;
          const Icon = tab.icon;
          return (
            <div
              key={tab.type}
              className="hub-content-panel"
              role="tabpanel"
              id={`${id}-${tab.type}-panel`}
              aria-labelledby={`${id}-${tab.type}-tab`}
              tabIndex={active ? 0 : -1}
              hidden={!active}
            >
              {active && (
                <div className="hub-results">
                  <div className="hub-results-heading">
                    <div className="hub-category-heading">
                      <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
                      <div>
                        <strong>{t(tab.label)}</strong>
                        <span>{t("جدیدترین مطالب این بخش")}</span>
                      </div>
                    </div>
                    <Link
                      href={archive}
                      className="hub-view-all"
                      prefetch={false}
                      aria-label={`${t("مشاهده همه")} ${t(tab.label)}`}
                    >
                      {t("مشاهده همه")}
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </Link>
                  </div>
                  {items.length ? (
                    <div className="hub-results-grid">
                      {items.map((item, index) => (
                        <div
                          key={item.id}
                          className="hub-result-card"
                          style={
                            {
                              "--card-delay": `${index * 45}ms`,
                            } as CSSProperties
                          }
                        >
                          <Card
                            item={item}
                            resource={
                              tab.type === "article" ? "articles" : "news"
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty message={t("مطلبی در این بخش منتشر نشده است.")} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
