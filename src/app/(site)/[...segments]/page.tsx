import { PageTitle, Pages } from "@/components/common";
import { PublicDetail } from "@/components/public-detail";
import { PublicFilters } from "@/components/public-filters";
import { PublicList } from "@/components/public-list";
import { PublicLoading } from "@/components/public-loading";
import { PublicUnavailable } from "@/components/public-unavailable";
import { CmsPage } from "@/components/cms-page";
import { publicApiUnavailable, serverApi } from "@/lib/api-server";
import { ApiError } from "@/lib/errors";
import { localePath, number } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n-server";
import {
  missingDocumentArchives,
  publicQuery,
  publicResources,
} from "@/lib/public-resources";
import { entityPath, text, title } from "@/lib/shared";
import type { ApiResponse, Entity, SearchParams } from "@/lib/types";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import { Suspense } from "react";

interface Props {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<SearchParams>;
}

async function checkedSegments(values: string[]): Promise<string[]> {
  const path = (await headers()).get("x-site-path");
  let segments = values;

  if (path) {
    if (!path.startsWith("/") || path.startsWith("//")) notFound();
    try {
      segments = path.slice(1).split("/").map(decodeURIComponent);
    } catch {
      notFound();
    }
  }

  if (
    segments.some(
      (value) =>
        !value ||
        value === "." ||
        value === ".." ||
        /[/\\\u0000-\u001f]/.test(value),
    )
  )
    notFound();
  return segments;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, t } = await getTranslations();
  const segments = await checkedSegments((await params).segments);
  const config = Object.hasOwn(publicResources, segments[0])
    ? publicResources[segments[0]]
    : undefined;
  if (config && segments.length > 2) return {};
  if (!config) {
    const path = "/" + segments.join("/");
    if (path.length > 240) return {};
    try {
      const { data } = await serverApi<Entity>(
        "/api/v1/page-path?path=" + encodeURIComponent(path),
      );
      const canonical = entityPath("pages", data);
      const headline = text(data.meta_title) || title(data);
      const description = text(data.meta_description || data.summary);
      return {
        title: headline,
        description,
        alternates: {
          canonical: localePath(canonical, locale),
          languages: { "fa-IR": canonical, en: localePath(canonical, "en") },
        },
        openGraph: { title: headline, description, type: "article" },
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return {};
      if (!publicApiUnavailable(error)) throw error;
      return {};
    }
  }
  if (segments.length === 1) return { title: t(config.label) };
  try {
    const { data } = await serverApi<Entity>(
      "/api/v1/" + config.api + "/" + encodeURIComponent(segments[1]),
    );
    return {
      title: text(data.meta_title) || title(data),
      description: text(
        data.meta_description ||
          data.summary ||
          data.excerpt ||
          data.description,
      ),
      openGraph: { title: title(data), type: "article" },
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { title: t(config.label) };
    }
    if (!publicApiUnavailable(error)) throw error;
    return { title: t(config.label) };
  }
}

async function ResourceResults({
  resource,
  query,
}: {
  resource: string;
  query: URLSearchParams;
}) {
  const { locale, t } = await getTranslations();
  const config = publicResources[resource];
  let result: ApiResponse<Entity[]>;

  try {
    result = await serverApi<Entity[]>("/api/v1/" + config.api + "?" + query);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    if (error instanceof ApiError && error.status === 422) {
      return (
        <p className="form-error" role="alert">
          {t("فیلترها معتبر نیستند. تاریخ‌ها و مقادیر واردشده را بررسی کنید.")}
        </p>
      );
    }
    if (publicApiUnavailable(error)) return <PublicUnavailable />;
    throw error;
  }

  return (
    <>
      <p className="result-count">
        {number(result.pagination?.total ?? result.data.length, locale)}{" "}
        {t("مورد")}
      </p>
      <PublicList resource={resource} items={result.data} />
      <Pages
        pagination={result.pagination}
        path={"/" + resource}
        query={query}
      />
    </>
  );
}

export default async function ResourcePage({ params, searchParams }: Props) {
  const { locale, t } = await getTranslations();
  const segments = await checkedSegments((await params).segments);
  const [resource, key] = segments;
  const config = Object.hasOwn(publicResources, resource)
    ? publicResources[resource]
    : undefined;
  if (!config) {
    const path = "/" + segments.join("/");
    if (path.length > 240) notFound();
    let data: Entity;
    try {
      data = (
        await serverApi<Entity>(
          "/api/v1/page-path?path=" + encodeURIComponent(path),
        )
      ).data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) notFound();
      if (!publicApiUnavailable(error)) throw error;
      return (
        <div className="page-container inner-page">
          <PublicUnavailable />
        </div>
      );
    }
    const canonical = entityPath("pages", data);
    if (canonical !== path) permanentRedirect(localePath(canonical, locale));
    return <CmsPage item={data} />;
  }
  if (segments.length > 2) notFound();
  const query = publicQuery(await searchParams, resource);

  if (key) {
    let result: ApiResponse<Entity>;
    try {
      result = await serverApi<Entity>(
        "/api/v1/" + config.api + "/" + encodeURIComponent(key),
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        const archive =
          resource === "documents" &&
          Object.hasOwn(missingDocumentArchives, key)
            ? missingDocumentArchives[key]
            : undefined;
        if (archive) redirect(localePath(archive, locale));
        notFound();
      }
      if (!publicApiUnavailable(error)) throw error;
      return (
        <div className="page-container inner-page">
          <PageTitle title={t(config.label)} />
          <PublicUnavailable />
        </div>
      );
    }
    const data = result.data;
    if (resource === "pages") {
      const canonical = entityPath("pages", data);
      if (text(data.path)) permanentRedirect(localePath(canonical, locale));
      return <CmsPage item={data} />;
    }
    if (resource === "news" && data.type === "article") {
      redirect(localePath(entityPath("articles", data), locale));
    }
    if (resource === "articles" && data.type !== "article") {
      redirect(localePath(entityPath("news", data), locale));
    }
    if (/^\d+$/.test(key) && text(data.slug) && key !== text(data.slug)) {
      redirect(localePath(entityPath(resource, data), locale));
    }
    return (
      <div className="page-container inner-page">
        <PageTitle title={title(data)} />
        <PublicDetail resource={resource} item={data} />
      </div>
    );
  }

  return (
    <div className="page-container inner-page">
      <PageTitle
        title={t(config.label)}
        description={
          resource === "albums"
            ? t("آلبوم‌های تصویری نشست‌ها و رویدادهای کانون")
            : undefined
        }
      />
      <Suspense fallback={<PublicLoading />}>
        <PublicFilters resource={resource} query={query} />
      </Suspense>
      <Suspense
        key={resource + "?" + query.toString()}
        fallback={<PublicLoading />}
      >
        <ResourceResults resource={resource} query={query} />
      </Suspense>
    </div>
  );
}
