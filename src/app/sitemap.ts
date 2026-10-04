import type { MetadataRoute } from "next";
import { serverApi } from "@/lib/api-server";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const { data } = await serverApi<{ path: string; updated_at: string }[]>(
    "/api/v1/seo/sitemap",
  );
  return [
    ...[
      "/",
      "/news",
      "/articles",
      "/documents",
      "/experts",
      "/expert-groups",
      "/albums",
      "/events",
      "/agreements",
      "/contact",
      "/board-members",
      "/bank-accounts",
    ].map((path) => ({ url: base + path })),
    ...data
      .filter(
        (item) =>
          item.path.startsWith("/") &&
          !item.path.startsWith("//") &&
          item.path !== "/tariffs/calculator",
      )
      .map((item) => ({
        url: base + item.path,
        lastModified: item.updated_at,
      })),
  ];
}
