export const PUBLIC_API_CACHE_TAG = "kkr-public-content";

const resources = new Set([
  "home",
  "slideshow",
  "settings",
  "navigation",
  "posts",
  "documents",
  "pages",
  "page-path",
  "albums",
  "events",
  "experts",
  "expert-groups",
  "disciplines",
  "qualifications",
  "board-members",
  "board-terms",
  "agreements",
  "faqs",
  "bank-accounts",
  "links",
  "categories",
  "tags",
]);

export function cacheablePublicPath(path: string): boolean {
  const pathname = path.split("?", 1)[0];
  const segments = pathname.split("/").filter(Boolean);
  return (
    segments[0] === "api" &&
    segments[1] === "v1" &&
    segments.length <= 4 &&
    (resources.has(segments[2]) || pathname === "/api/v1/seo/sitemap")
  );
}
