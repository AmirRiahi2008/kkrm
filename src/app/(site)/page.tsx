import { BoardContact } from "@/components/board-contact";
import { Card, Empty, SectionTitle } from "@/components/common";
import { HomeContentTabs } from "@/components/home-content-tabs";
import { Hero, HomeNews } from "@/components/home-interactive";
import Link from "@/components/localized-link";
import { PublicUnavailable } from "@/components/public-unavailable";
import { PointerSystemLink } from "@/components/pointer-system-link";
import { publicApiUnavailable, serverApi } from "@/lib/api-server";
import { ApiError } from "@/lib/errors";
import { localDate, localePath } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n-server";
import {
  EXPERT_LOGIN,
  entityPath,
  mediaOf,
  mediaUrl,
  safeHref,
  text,
  title,
} from "@/lib/shared";
import type { Entity, HomeData, SearchParams } from "@/lib/types";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  HelpCircle,
  History,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { redirect } from "next/navigation";

const groupedContentTypes = new Set([
  "announcement",
  "news",
  "article",
  "resolution",
  "welfare",
]);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { locale, t } = await getTranslations();
  const params = await searchParams;
  if (typeof params.page_id === "string" && /^\d+$/.test(params.page_id)) {
    let path: string | null = null;
    try {
      path = (
        await serverApi<{ new_path: string }>(
          "/api/v1/redirects/resolve?path=" +
            encodeURIComponent("/?page_id=" + params.page_id),
        )
      ).data.new_path;
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) throw error;
    }
    const destination = safeHref(path);
    if (destination?.startsWith("/")) redirect(localePath(destination, locale));
  }
  const [homeResult, newsResult] = await Promise.allSettled([
    serverApi<HomeData>("/api/v1/home"),
    serverApi<Entity[]>("/api/v1/slideshow"),
  ]);
  if (homeResult.status === "rejected") {
    if (!publicApiUnavailable(homeResult.reason)) throw homeResult.reason;
    return (
      <div className="page-container inner-page">
        <PublicUnavailable />
      </div>
    );
  }
  const data = homeResult.value.data;
  const newsUnavailable = newsResult.status === "rejected";
  if (
    newsUnavailable &&
    !(
      newsResult.reason instanceof ApiError && newsResult.reason.status === 404
    ) &&
    !publicApiUnavailable(newsResult.reason)
  ) {
    throw newsResult.reason;
  }
  const selectedSlides =
    newsResult.status === "fulfilled" ? newsResult.value.data : [];
  const president =
    data.president ||
    data.board_members.find((member) => {
      const position = text(member.original_position || member.position)
        .replace(/ي/g, "ی")
        .replace(/ئ/g, "ی");
      return (
        member.role === "board" &&
        /رییس|رئیس|president|chair/i.test(position) &&
        !/نایب|نائب|vice|deputy/i.test(position)
      );
    });
  const photo = mediaOf(president?.photo);
  const contentSections = data.sections
    .filter((section) => groupedContentTypes.has(section.type))
    .map((section) => ({
      ...section,
      items: section.items.slice(0, 3).map((item) => ({
        id: item.id,
        title: title(item),
        slug: item.slug,
        type: item.type,
        cover: item.cover,
        photo: item.photo,
        image: item.image,
        published_at: item.published_at,
        excerpt: item.excerpt || item.description,
      })),
    }));
  const formerPresidents = data.former_presidents || [];
  const services = [
    ["پنل کارشناسان", "پروفایل کارشناس و ثبت فیش", EXPERT_LOGIN, "fig-157.png"],
    [
      "سامانه ۲۰۲۰",
      "ارجاع کارهای کارشناسی",
      "https://2020kanoon.ir/",
      "fig-157.png",
    ],
    [
      "خدمات قضایی",
      "خدمات الکترونیک قضایی",
      "https://adliran.ir/",
      "fig-167.png",
    ],
    ["جستجوی کارشناس", "کارشناسان رسمی دادگستری", "/experts", "fig-172.png"],
    [
      "تعرفه دستمزد",
      "شرح تعرفه کارشناسی",
      "/documents/tariff-description",
      "fig-177.png",
    ],
    ["سامانه‌ها", "دسترسی به خدمات الکترونیک", "/systems", "fig-182.png"],
  ];
  return (
    <>
      {newsUnavailable && (
        <div className="page-container">
          <PublicUnavailable compact />
        </div>
      )}
      <section className="hero-section page-container home-hero-refined">
        <Hero posts={selectedSlides} unavailable={newsUnavailable} />
        <HomeNews sections={data.sections} />
        <aside
          className={
            "president-card president-refined" + (photo ? "" : " without-image")
          }
        >
          <div className="president-heading">
            <ShieldCheck size={18} />
            <span>{t("رئیس کانون")}</span>
          </div>
          {president ? (
            <>
              {photo && (
                <img
                  className="president-photo"
                  src={mediaUrl(photo)}
                  alt={title(president)}
                />
              )}
              <h2>{title(president)}</h2>
              <p>{text(president.position)}</p>
              <BoardContact item={president} />
              <Link
                prefetch={false}
                href={entityPath("board-members", president)}
                className="president-profile-link"
              >
                {t("درباره رئیس کانون")}
                <ArrowUpRight size={16} />
              </Link>
            </>
          ) : (
            <p className="quiet">
              {locale === "en"
                ? "The president’s profile will appear here."
                : "معرفی رئیس کانون در این بخش نمایش داده می‌شود."}
            </p>
          )}
          <Link prefetch={false} href="/board-members" className="board-link">
            {t("اعضای هیئت مدیره و ارکان")}
            <ArrowUpRight size={16} />
          </Link>
        </aside>
      </section>
      <section
        className="services-section page-container services-refined"
        aria-label={t("خدمات کانون")}
      >
        {services.map(([label, hint, href, icon]) => (
          <PointerSystemLink
            className="service-card"
            href={href}
            key={label}
          >
            <span className="service-icon">
              <img src={"/assets/" + icon} alt="" />
            </span>
            <strong>{t(label)}</strong>
            <span>{t(hint)}</span>
            <ArrowUpRight size={16} className="service-arrow" />
          </PointerSystemLink>
        ))}
      </section>
      <HomeContentTabs sections={contentSections} />
      <section className="home-section page-container event-section-refined">
        <div className="event-section-intro">
          <span className="eyebrow">
            <CalendarDays size={17} />
            {t("تقویم کانون")}
          </span>
          <h2>{t("رویدادهای کانون")}</h2>
          <p>
            {locale === "en"
              ? "Stay informed about upcoming meetings, training and council events."
              : "از نشست‌ها، آموزش‌ها و برنامه‌های پیش روی کانون باخبر شوید."}
          </p>
          <Link href="/events" prefetch={false} className="all-link">
            {t("مشاهده همه")}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="event-agenda">
          {data.events.length ? (
            data.events.map((item) => {
              const cover = mediaOf(item.cover);
              return (
                <Link
                  className="agenda-card"
                  href={entityPath("events", item)}
                  key={item.id}
                  prefetch={false}
                >
                  <div className="agenda-date">
                    <CalendarDays size={23} />
                    <time>{localDate(item.starts_at, locale)}</time>
                  </div>
                  <div className="agenda-copy">
                    <span className="eyebrow">
                      {t(
                        item.mode === "online"
                          ? "مجازی"
                          : item.mode === "hybrid"
                            ? "حضوری و مجازی"
                            : "حضوری",
                      )}
                    </span>
                    <h3>{title(item)}</h3>
                    {item.location && (
                      <p>
                        <MapPin size={14} />
                        {text(item.location)}
                      </p>
                    )}
                  </div>
                  {cover && <img src={mediaUrl(cover)} alt="" loading="lazy" />}
                  <ArrowUpRight size={20} />
                </Link>
              );
            })
          ) : (
            <Empty message={t("در حال حاضر رویدادی پیش رو نیست.")} />
          )}
        </div>
      </section>
      {data.sections
        .filter(
          (section) =>
            !groupedContentTypes.has(section.type) &&
            section.type !== "condolence" &&
            section.items.length > 0,
        )
        .map((section) => (
          <section
            key={section.type}
            className="home-section page-container editorial-section"
          >
            <SectionTitle
              title={t(section.title)}
              href={section.archive_path}
            />
            <div className="cards-grid">
              {section.items.slice(0, 3).map((item) => (
                <Card
                  key={item.id}
                  item={item}
                  resource={section.type === "article" ? "articles" : "news"}
                />
              ))}
            </div>
          </section>
        ))}
      <section className="gallery-preview gallery-refined">
        <div className="page-container">
          <div className="gallery-preview-heading">
            <div>
              <span className="eyebrow">{t("گزارش تصویری")}</span>
              <SectionTitle title={t("روایت تصویری کانون")} href="/albums" />
              <p>
                {t(
                  "نشست‌ها، رویدادها و لحظه‌های کانون را در آلبوم‌های تصاویر ببینید.",
                )}
              </p>
            </div>
          </div>
          <div className="cards-grid">
            {data.albums.map((item) => (
              <Card key={item.id} item={item} resource="albums" />
            ))}
          </div>
          {!data.albums.length && <Empty />}
        </div>
      </section>
      {formerPresidents.length > 0 && (
        <section className="home-section page-container former-presidents-section">
          <span className="eyebrow">
            <History size={17} />
            {t("رؤسای ادوار")}
          </span>
          <SectionTitle
            title={t("رؤسای پیشین کانون")}
            href="/board-members?role=former_president"
          />
          <div className="former-presidents-grid">
            {formerPresidents.slice(0, 6).map((item) => (
              <Card key={item.id} item={item} resource="board-members" />
            ))}
          </div>
        </section>
      )}
      <section className="home-section page-container support-links">
        <Link href="/faqs" prefetch={false}>
          <HelpCircle size={30} />
          <div>
            <h2>{t("پرسش‌های متداول")}</h2>
            <p>
              {locale === "en"
                ? "Find answers to common questions."
                : "پاسخ پرسش‌های رایج را اینجا پیدا کنید."}
            </p>
          </div>
          <ArrowUpRight size={24} />
        </Link>
        <Link href="/contact" prefetch={false}>
          <MessageCircle size={30} />
          <div>
            <h2>{t("ارتباط با کانون")}</h2>
            <p>
              {locale === "en"
                ? "Contact our public relations team."
                : "با روابط عمومی کانون در ارتباط باشید."}
            </p>
          </div>
          <ArrowLeft size={24} />
        </Link>
      </section>
      <section className="home-section page-container systems-refined">
        <SectionTitle title={t("سامانه‌های مرتبط")} href="/systems" />
        <div className="systems-grid">
          {data.systems.map((item) => {
            const href = safeHref(item.url);
            return (
              href && (
                <PointerSystemLink
                  className="system-link"
                  href={href}
                  key={item.id}
                  external
                >
                  <strong>{title(item)}</strong>
                  <span>{t("ورود به سامانه ↗")}</span>
                </PointerSystemLink>
              )
            );
          })}
        </div>
      </section>
    </>
  );
}
