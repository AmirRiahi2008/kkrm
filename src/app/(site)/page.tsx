import Link from "next/link";
import { redirect } from "next/navigation";
import { serverApi } from "@/lib/api-server";
import { ApiError } from "@/lib/errors";
import { Hero, HomeNews } from "@/components/home-interactive";
import { Card, SectionTitle } from "@/components/common";
import { BoardContact } from "@/components/board-contact";
import {
  EXPERT_LOGIN,
  entityPath,
  mediaUrl,
  mediaOf,
  safeHref,
  title,
} from "@/lib/shared";
import type { HomeData, SearchParams } from "@/lib/types";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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
    if (
      path &&
      safeHref(path)?.startsWith("/") &&
      path !== "/tariffs/calculator"
    )
      redirect(path);
  }
  const { data } = await serverApi<HomeData>("/api/v1/home");
  const president =
    data.board_members.find((member) =>
      String(member.position).includes("رئیس"),
    ) || data.board_members[0];
  const presidentPhoto = mediaOf(president?.photo);
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
      <section className="hero-section page-container">
        <Hero slides={data.slides} featured={data.featured_posts} />
        <HomeNews sections={data.sections} />
        <aside
          className={
            "president-card" + (presidentPhoto ? "" : " without-image")
          }
        >
          {president && (
            <>
              {presidentPhoto && (
                <img
                  className="president-photo"
                  src={mediaUrl({ id: presidentPhoto.id })}
                  alt={title(president)}
                />
              )}
              <h2>{title(president)}</h2>
              <p>{String(president.position || "")}</p>
              <Link
                prefetch={false}
                href={entityPath("board-members", president)}
                className="primary-button"
              >
                درباره رئیس کانون
              </Link>
              <BoardContact item={president} />
            </>
          )}
          <Link prefetch={false} href="/board-members" className="board-link">
            اعضای هیئت مدیره و ارکان
          </Link>
        </aside>
      </section>
      <section
        className="services-section page-container"
        aria-label="خدمات کانون"
      >
        {services.map(([label, hint, href, icon]) => (
          <Link
            prefetch={false}
            className="service-card"
            href={href}
            key={label}
          >
            <span className="service-icon">
              <img src={"/assets/" + icon} alt="" />
            </span>
            <strong>{label}</strong>
            <span>{hint}</span>
          </Link>
        ))}
      </section>
      <section className="home-section page-container">
        <SectionTitle
          title="اطلاعیه‌های کانون"
          href="/news?type=announcement"
        />
        <div className="notice-grid">
          {data.sections
            .find((section) => section.type === "announcement")
            ?.items.slice(0, 5)
            .map((item) => {
              const cover = mediaOf(item.cover);
              return (
                <Link
                  prefetch={false}
                  key={item.id}
                  href={entityPath("news", item)}
                  className={"notice-card" + (cover ? "" : " without-image")}
                >
                  {cover && (
                    <img
                      src={mediaUrl({ id: cover.id })}
                      alt={title(item)}
                      loading="lazy"
                    />
                  )}
                  <strong>{title(item)}</strong>
                </Link>
              );
            })}
        </div>
      </section>
      <section className="banners-section page-container">
        <Link prefetch={false} className="questions-banner" href="/faqs">
          <img
            src="/assets/questions-banner.png"
            alt="پرسش‌های متداول"
            loading="lazy"
          />
        </Link>
        <Link prefetch={false} className="phone-banner" href="/contact">
          <img
            src="/assets/phone-banner.png"
            alt="ارتباط با کانون"
            loading="lazy"
          />
        </Link>
      </section>
      <section className="home-section page-container">
        <SectionTitle title="رویدادهای کانون" href="/events" />
        <div className="cards-grid">
          {data.events.map((item) => (
            <Card key={item.id} item={item} resource="events" />
          ))}
        </div>
        {!data.events.length && (
          <p className="quiet">در حال حاضر رویدادی پیش رو نیست.</p>
        )}
      </section>
      {data.sections
        .filter(
          (section) => !["announcement", "condolence"].includes(section.type),
        )
        .map((section) => (
          <section key={section.type} className="home-section page-container">
            <SectionTitle title={section.title} href={section.archive_path} />
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
      <section className="gallery-preview">
        <div className="page-container">
          <SectionTitle title="روایت تصویری کانون" href="/albums" />
          <p>
            نشست‌ها، رویدادها و لحظه‌های کانون را در آلبوم‌های تصاویر ببینید.
          </p>
          <div className="cards-grid">
            {data.albums.map((item) => (
              <Card key={item.id} item={item} resource="albums" />
            ))}
          </div>
        </div>
      </section>
      <section className="home-section page-container">
        <SectionTitle title="سامانه‌های مرتبط" href="/systems" />
        <div className="systems-grid">
          {data.systems
            .filter((item) => safeHref(item.url))
            .map((item) => (
              <a
                className="system-link"
                href={safeHref(item.url)!}
                key={item.id}
                target="_blank"
                rel="noopener noreferrer"
              >
                {title(item)}
                <span>ورود به سامانه ↗</span>
              </a>
            ))}
        </div>
      </section>
    </>
  );
}
