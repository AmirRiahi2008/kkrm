import type { MetadataRoute } from "next";
import { publicApiUnavailable, serverApi } from "@/lib/api-server";
import { localePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  let data: { path: string; updated_at: string }[] = [];
  try {
    data = (await serverApi<typeof data>("/api/v1/seo/sitemap")).data;
  } catch (error) {
    if (!publicApiUnavailable(error)) throw error;
  }
  const entries = new Map<string, string | undefined>();
  for (const path of [
    "/",
    "/news",
    "/articles",
    "/documents",
    "/experts",
    "/download",
    "/tariffs/calculator",
    "/expert-groups",
    "/albums",
    "/events",
    "/agreements",
    "/contact",
    "/board-members",
    "/bank-accounts",
    "/faqs",
    "/systems",
    "/pages/history",
  ])
    entries.set(path, undefined);
  for (const item of data) {
    if (
      item.path.startsWith("/") &&
      !item.path.startsWith("//") &&
      !/[\\\u0000-\u001f]/.test(item.path)
    )
      entries.set(item.path, item.updated_at);
  }
  return [...entries].flatMap(([path, updated]) =>
    (["fa", "en"] as const).map((locale) => ({
      url: base + localePath(path, locale),
      ...(updated ? { lastModified: updated } : {}),
      alternates: {
        languages: {
          "fa-IR": base + localePath(path, "fa"),
          en: base + localePath(path, "en"),
        },
      },
    })),
  );
}
