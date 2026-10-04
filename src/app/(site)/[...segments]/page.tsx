import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverApi } from "@/lib/api-server";
import { ApiError } from "@/lib/errors";
import { publicResources, publicQuery } from "@/lib/public-resources";
import { title, text, faNumber } from "@/lib/shared";
import { PageTitle, Pages } from "@/components/common";
import { PublicFilters } from "@/components/public-filters";
import { PublicList } from "@/components/public-list";
import { PublicDetail } from "@/components/public-detail";
import type { ApiResponse, Entity, SearchParams } from "@/lib/types";

interface Props {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<SearchParams>;
}
function decodedSegments(values: string[]): string[] {
  try {
    return values.map((value) => decodeURIComponent(value));
  } catch {
    notFound();
  }
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const segments = decodedSegments((await params).segments);
  const config = publicResources[segments[0]];
  if (!config || segments.length > 2) return {};
  if (segments.length === 1) return { title: config.label };
  try {
    const { data } = await serverApi<Entity>(
      "/api/v1/" + config.api + "/" + encodeURIComponent(segments[1]),
    );
    return {
      title: text(data.meta_title) || title(data),
      description: text(
        data.meta_description || data.excerpt || data.description,
      ),
      openGraph: { title: title(data), type: "article" },
    };
  } catch {
    return { title: "محتوا در دسترس نیست" };
  }
}
async function readPublic<T>(path: string): Promise<ApiResponse<T> | null> {
  try {
    return await serverApi<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    if (error instanceof ApiError && error.status === 422) return null;
    throw error;
  }
}
export default async function ResourcePage({ params, searchParams }: Props) {
  const segments = decodedSegments((await params).segments);
  const [resource, key] = segments;
  const config = publicResources[resource];
  if (!config || segments.length > 2) notFound();
  const query = publicQuery(await searchParams, resource);
  if (key) {
    const result = await readPublic<Entity>(
      "/api/v1/" + config.api + "/" + encodeURIComponent(key),
    );
    if (!result) notFound();
    const data = result.data;
    if (
      (resource === "articles" && data.type !== "article") ||
      (resource === "news" && data.type === "article")
    )
      notFound();
    return (
      <div className="page-container inner-page">
        <PageTitle title={title(data)} />
        <PublicDetail resource={resource} item={data} />
      </div>
    );
  }
  const result = await readPublic<Entity[]>(
    "/api/v1/" + config.api + "?" + query,
  );
  if (!result)
    return (
      <div className="page-container inner-page">
        <PageTitle title={config.label} />
        <p className="form-error">
          فیلترها معتبر نیستند. تاریخ‌ها و مقادیر واردشده را بررسی کنید.
        </p>
        <PublicFilters resource={resource} query={query} />
      </div>
    );
  return (
    <div className="page-container inner-page">
      <PageTitle
        title={config.label}
        description={
          resource === "albums"
            ? "آلبوم‌های تصویری و ویدئویی نشست‌ها و رویدادهای کانون"
            : undefined
        }
      />
      <PublicFilters resource={resource} query={query} />
      <p className="result-count">
        {faNumber(result.pagination?.total || result.data.length)} مورد
      </p>
      <PublicList resource={resource} items={result.data} />
      <Pages
        pagination={result.pagination}
        path={"/" + resource}
        query={query}
      />
    </div>
  );
}
