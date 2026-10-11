import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const prefixed = path === "/en" || path.startsWith("/en/");
  const targetPath = prefixed ? path.slice(3) || "/" : path;
  const privatePath = /^\/(admin|backend|api|assets|auth)(\/|$)/.test(
    targetPath,
  );
  if (prefixed && privatePath) {
    return NextResponse.redirect(
      new URL(targetPath + request.nextUrl.search, request.url),
    );
  }
  const english =
    prefixed ||
    (!privatePath &&
      request.headers.get("x-site-locale") === "en" &&
      request.headers.get("x-site-path") === targetPath);
  const headers = new Headers(request.headers);
  headers.set("x-site-locale", english ? "en" : "fa");
  headers.set("x-site-path", targetPath);
  if (prefixed) {
    const destination = request.nextUrl.clone();
    destination.pathname = targetPath;
    return NextResponse.rewrite(destination, { request: { headers } });
  }
  return NextResponse.next({ request: { headers } });
}
export const config = {
  matcher: [
    "/((?!_next|backend|api|assets|pwa/|sw\\.js|manifest\\.webmanifest|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
