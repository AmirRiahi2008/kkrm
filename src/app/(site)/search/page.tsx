import { Empty, Pages, PageTitle, SectionTitle } from "@/components/common";
import { PublicList } from "@/components/public-list";
import { PublicUnavailable } from "@/components/public-unavailable";
import { publicApiUnavailable, serverApi } from "@/lib/api-server";
import { ApiError } from "@/lib/errors";
import { localePath, number } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n-server";
import { postTypes } from "@/lib/shared";
import { pageNumber } from "@/lib/public-resources";
import type {
  ApiResponse,
  Entity,
  Pagination,
  SearchParams,
} from "@/lib/types";

type SearchResult = {
  total: number;
  results: Record<
    string,
    { items: Entity[]; total: number; pagination: Pagination }
  >;
};

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("جستجو"), robots: { index: false, follow: true } };
}
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { locale, t } = await getTranslations();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 150) : "";
  const type =
    typeof params.type === "string" &&
    ["news", "announcement", "resolution"].includes(params.type)
      ? params.type
      : "";
  const query = new URLSearchParams({
    q,
    page: String(pageNumber(params.page)),
    per_page: "6",
  });
  if (type) query.set("type", type);
  let result: ApiResponse<SearchResult> | null = null;
  let unavailable = false;
  let invalid = false;
  if (Array.from(q).length >= 2) {
    try {
      result = await serverApi<SearchResult>("/api/v1/search?" + query);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        invalid = true;
      } else if (publicApiUnavailable(error)) {
        unavailable = true;
      } else {
        throw error;
      }
    }
  }
  return (
    <div className="page-container inner-page">
      <PageTitle
        title={t("جستجو در سایت")}
        description={t("جستجو در اخبار، اطلاعیه‌ها و مصوبات")}
      />
      <form action={localePath("/search", locale)} className="search-page-form">
        <label className="sr-only" htmlFor="search-term">
          {t("عبارت جستجو")}
        </label>
        <input
          id="search-term"
          name="q"
          defaultValue={q}
          minLength={2}
          maxLength={150}
          required
          placeholder={t("عبارت جستجو…")}
        />
        <button className="primary-button">{t("جستجو")}</button>
      </form>
      {invalid ? (
        <p className="form-error" role="alert">
          {locale === "en"
            ? "The search terms are invalid. Please try another phrase."
            : "عبارت جستجو معتبر نیست. عبارت دیگری را امتحان کنید."}
        </p>
      ) : unavailable ? (
        <PublicUnavailable />
      ) : result ? (
        <>
          <p className="result-count">
            {number(result.data.total, locale)}{" "}
            {locale === "en" ? "results for" : "نتیجه برای"} «{q}»
          </p>
          {Object.entries(result.data.results).map(([key, group]) => (
            <section className="home-section" key={key}>
              <SectionTitle
                title={t(postTypes[key])}
                href={"/search?" + new URLSearchParams({ q, type: key })}
              />
              <PublicList resource="news" items={group.items} />
              {type && (
                <Pages
                  pagination={group.pagination}
                  path="/search"
                  query={query}
                />
              )}
            </section>
          ))}
          {!result.data.total && (
            <Empty
              message={t("نتیجه‌ای پیدا نشد. عبارت دیگری را امتحان کنید.")}
            />
          )}
        </>
      ) : (
        <Empty message={t("برای جستجو حداقل دو حرف وارد کنید.")} />
      )}
    </div>
  );
}
