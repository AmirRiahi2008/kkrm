import { PageTitle, Pages } from "@/components/common";
import { ExpertSearchForm } from "@/components/expert-search-form";
import { PublicList } from "@/components/public-list";
import { PublicLoading } from "@/components/public-loading";
import { PublicUnavailable } from "@/components/public-unavailable";
import { publicApiUnavailable, serverApi } from "@/lib/api-server";
import { ApiError } from "@/lib/errors";
import { number } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n-server";
import type { ExpertDirectoryFilters } from "@/lib/portal-types";
import { publicQuery } from "@/lib/public-resources";
import type { ApiResponse, Entity, SearchParams } from "@/lib/types";
import { Suspense } from "react";
import "@/app/expert-directory.css";

export async function generateMetadata() {
  const { locale } = await getTranslations();
  return {
    title:
      locale === "en" ? "Advanced expert search" : "جستجوی پیشرفته کارشناسان",
  };
}

async function Directory({ params }: { params: SearchParams }) {
  const { locale } = await getTranslations();
  const query = publicQuery(params, "experts");
  for (const key of ["qualification_id", "status"]) {
    const value = params[key];
    if (
      typeof value === "string" &&
      (key === "status"
        ? ["active", "suspended"].includes(value)
        : /^[1-9]\d*$/.test(value))
    )
      query.set(key, value);
  }
  const optionQuery = new URLSearchParams();
  for (const key of ["expert_group_id", "discipline_id"])
    if (query.has(key)) optionQuery.set(key, query.get(key)!);
  let response: [ApiResponse<ExpertDirectoryFilters>, ApiResponse<Entity[]>];
  try {
    response = await Promise.all([
      serverApi<ExpertDirectoryFilters>(
        "/api/v1/experts/filters?" + optionQuery,
      ),
      serverApi<Entity[]>("/api/v1/experts?" + query),
    ]);
  } catch (error) {
    if (
      publicApiUnavailable(error) ||
      (error instanceof ApiError && error.status === 404)
    )
      return <PublicUnavailable />;
    if (error instanceof ApiError && error.status === 422)
      return (
        <p className="form-error" role="alert">
          {locale === "en"
            ? "Please check your search filters."
            : "مقادیر فیلتر جستجو معتبر نیستند؛ مقادیر را بررسی کنید."}
        </p>
      );
    throw error;
  }
  const [filters, result] = response;
  return (
    <>
      <ExpertSearchForm
        key={query.toString()}
        initialFilters={filters.data}
        initialQuery={query.toString()}
      />
      <div className="expert-directory-results" aria-live="polite">
        <div className="directory-results-heading">
          <h2>{locale === "en" ? "Search results" : "نتایج جستجو"}</h2>
          <span>
            {number(result.pagination?.total ?? result.data.length, locale)}{" "}
            {locale === "en" ? "experts" : "کارشناس"}
          </span>
        </div>
        <PublicList resource="experts" items={result.data} />
        <Pages pagination={result.pagination} path="/experts" query={query} />
      </div>
    </>
  );
}

export default async function ExpertDirectory({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await getTranslations();
  const params = await searchParams;
  return (
    <div className="page-container inner-page expert-directory">
      <PageTitle
        title={
          locale === "en"
            ? "Advanced expert search"
            : "جستجوی پیشرفته کارشناسان"
        }
        description={
          locale === "en"
            ? "Search the council directory by name, group, discipline and qualification."
            : "جستجو در فهرست کارشناسان کانون بر اساس نام، گروه، رشته و صلاحیت"
        }
      />
      <Suspense key={JSON.stringify(params)} fallback={<PublicLoading />}>
        <Directory params={params} />
      </Suspense>
    </div>
  );
}
