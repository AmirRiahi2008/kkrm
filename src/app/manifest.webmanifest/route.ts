import type { MetadataRoute } from "next";
import { localePath } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const locale = await getLocale();
  const english = locale === "en";
  const manifest: MetadataRoute.Manifest = {
    id: "/",
    name: english
      ? "Mazandaran Official Justice Experts Council"
      : "کانون کارشناسان رسمی دادگستری مازندران",
    short_name: english ? "Mazandaran Council" : "کانون مازندران",
    description: english
      ? "News, documents and council services"
      : "اخبار، اسناد و خدمات کانون کارشناسان رسمی دادگستری مازندران",
    lang: english ? "en" : "fa-IR",
    dir: english ? "ltr" : "rtl",
    start_url: localePath("/?source=pwa", locale),
    scope: "/",
    display: "standalone",
    background_color: "#f4f7fa",
    theme_color: "#00477a",
    categories: ["news", "government"],
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: english ? "Find an expert" : "جستجوی کارشناسان",
        url: localePath("/experts", locale),
      },
      {
        name: english ? "Council news" : "اخبار کانون",
        url: localePath("/news", locale),
      },
      {
        name: english ? "Laws and documents" : "قوانین و اسناد",
        url: localePath("/documents", locale),
      },
    ],
  };

  return Response.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "private, no-store",
      Vary: "x-site-locale",
    },
  });
}
