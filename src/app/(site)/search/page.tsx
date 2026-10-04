import { serverApi } from "@/lib/api-server";
import { PageTitle, SectionTitle, Empty, Pages } from "@/components/common";
import { PublicList } from "@/components/public-list";
import { postTypes, faNumber } from "@/lib/shared";
import type { Entity, Pagination, SearchParams } from "@/lib/types";

export const metadata = {
  title: "جستجو",
  robots: { index: false, follow: true },
};
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 150) : "";
  const type =
    typeof params.type === "string" &&
    ["news", "announcement", "resolution"].includes(params.type)
      ? params.type
      : "";
  const query = new URLSearchParams({
    q,
    page: String(Math.min(10000, Math.max(1, Number(params.page) || 1))),
    per_page: "6",
  });
  if (type) query.set("type", type);
  const result =
    q.length >= 2
      ? await serverApi<{
          total: number;
          results: Record<
            string,
            { items: Entity[]; total: number; pagination: Pagination }
          >;
        }>("/api/v1/search?" + query)
      : null;
  return (
    <div className="page-container inner-page">
      <PageTitle
        title="جستجو در سایت"
        description="جستجو در اخبار، اطلاعیه‌ها و مصوبات"
      />
      <form action="/search" className="search-page-form">
        <label className="sr-only" htmlFor="search-term">
          عبارت جستجو
        </label>
        <input
          id="search-term"
          name="q"
          defaultValue={q}
          minLength={2}
          maxLength={150}
          required
          placeholder="عبارت جستجو…"
        />
        <button className="primary-button">جستجو</button>
      </form>
      {result ? (
        <>
          <p className="result-count">
            {faNumber(result.data.total)} نتیجه برای «{q}»
          </p>
          {Object.entries(result.data.results).map(([key, group]) => (
            <section className="home-section" key={key}>
              <SectionTitle
                title={postTypes[key]}
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
            <Empty message="نتیجه‌ای پیدا نشد. عبارت دیگری را امتحان کنید." />
          )}
        </>
      ) : (
        <Empty message="برای جستجو حداقل دو حرف وارد کنید." />
      )}
    </div>
  );
}
