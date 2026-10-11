import { backendFault, backendFetch } from "@/lib/backend-http";
import { PUBLIC_API_CACHE_TAG } from "@/lib/public-cache";
import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Context = {
  params: Promise<{ path: string[] }>;
};

const maxBodyBytes = 4250000;

async function proxy(request: NextRequest, context: Context) {
  const requestId = randomUUID();
  const started = Date.now();
  const { path } = await context.params;
  const invalidSegment = path.some(
    (segment) =>
      !segment ||
      segment === "." ||
      segment === ".." ||
      /[/\\\u0000-\u001f]/.test(segment),
  );
  const apiPath = path.length >= 3 && path[0] === "api" && path[1] === "v1";
  const mediaPath =
    path.length === 4 &&
    apiPath &&
    path[2] === "media" &&
    /^[1-9]\d*$/.test(path[3]);
  const csrfPath =
    path.length === 2 && path[0] === "sanctum" && path[1] === "csrf-cookie";

  function fail(status: number, message: string, code: string) {
    return Response.json(
      { success: false, message, error_code: code, request_id: requestId },
      {
        status,
        headers: {
          "Cache-Control": "private, no-store",
          "X-KKR-Request-Id": requestId,
          "X-KKR-Proxy-Error": code,
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }

  if (invalidSegment || (!apiPath && !csrfPath)) {
    return fail(404, "مسیر معتبر نیست.", "INVALID_PATH");
  }

  const write = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  let requestOrigin: string;
  try {
    const requestUrl = new URL(request.url);
    const host = request.headers.get("host") || requestUrl.host;
    if (/[\s/@\\?#,]/.test(host)) throw new Error("Invalid request host");
    requestOrigin = new URL(requestUrl.protocol + "//" + host).origin;
  } catch {
    return fail(403, "مبدأ درخواست معتبر نیست.", "INVALID_ORIGIN");
  }
  if (
    write &&
    (request.headers.get("origin") !== requestOrigin ||
      request.headers.get("sec-fetch-site") === "cross-site")
  ) {
    return fail(403, "مبدأ درخواست معتبر نیست.", "INVALID_ORIGIN");
  }

  let backend: URL;
  let site: URL;
  try {
    backend = new URL(process.env.API_URL || "");
    site = new URL(process.env.SITE_URL || "");
    if (
      !["http:", "https:"].includes(backend.protocol) ||
      !["http:", "https:"].includes(site.protocol) ||
      backend.username ||
      backend.password ||
      site.username ||
      site.password ||
      backend.search ||
      backend.hash ||
      backend.pathname !== "/"
    ) {
      throw new Error("Invalid server URL");
    }
  } catch {
    console.error("KKR_BACKEND_PROXY_CONFIG_ERROR", { requestId });
    return fail(
      503,
      "تنظیمات اتصال سرور کامل یا معتبر نیست.",
      "INVALID_CONFIG",
    );
  }

  const target = new URL(
    "/" + path.map(encodeURIComponent).join("/"),
    backend.origin,
  );
  target.search = request.nextUrl.search;
  let stage = "read-request";

  try {
    const length = Number(request.headers.get("content-length") || 0);
    if (write && length > maxBodyBytes) {
      return fail(
        413,
        "حجم فایل برای بارگذاری از این مسیر زیاد است؛ فایل کوچک‌تر انتخاب کنید.",
        "UPLOAD_TOO_LARGE",
      );
    }
    const body = write ? await request.arrayBuffer() : undefined;
    if (body && body.byteLength > maxBodyBytes) {
      return fail(
        413,
        "حجم فایل برای بارگذاری از این مسیر زیاد است؛ فایل کوچک‌تر انتخاب کنید.",
        "UPLOAD_TOO_LARGE",
      );
    }

    const headers = new Headers({
      Accept: "application/json",
      Origin: site.origin,
      Referer: site.origin + "/",
    });
    for (const name of [
      "cookie",
      "content-type",
      "x-xsrf-token",
      "x-requested-with",
      "x-site-locale",
      "range",
      "if-range",
      "if-none-match",
      "if-modified-since",
    ]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    stage = "fetch-backend";
    const publicMedia = mediaPath && ["GET", "HEAD"].includes(request.method);
    let authenticatedMedia = false;
    const referer = request.headers.get("referer");
    if (publicMedia && headers.has("cookie") && referer) {
      try {
        const source = new URL(referer);
        authenticatedMedia =
          source.origin === requestOrigin &&
          /^\/admin(?:\/|$)/.test(source.pathname);
      } catch {
        authenticatedMedia = false;
      }
    }
    const publicHeaders = new Headers(headers);
    if (publicMedia) {
      for (const name of ["cookie", "origin", "referer", "x-xsrf-token"]) {
        publicHeaders.delete(name);
      }
    }
    let upstream = await backendFetch(
      target,
      {
        method: request.method,
        headers: publicMedia && !authenticatedMedia ? publicHeaders : headers,
        body,
        signal: request.signal,
      },
      { media: mediaPath, timeoutMs: publicMedia ? 35000 : 45000 },
    );
    if (
      publicMedia &&
      !authenticatedMedia &&
      upstream.status === 404 &&
      headers.has("cookie")
    ) {
      await upstream.body?.cancel();
      authenticatedMedia = true;
      upstream = await backendFetch(
        target,
        { method: request.method, headers, signal: request.signal },
        { media: true, timeoutMs: 20000 },
      );
    }

    if (
      upstream.status >= 300 &&
      upstream.status < 400 &&
      upstream.status !== 304
    ) {
      console.error("KKR_BACKEND_PROXY_REDIRECT", {
        requestId,
        method: request.method,
        path: target.pathname,
        status: upstream.status,
      });
      await upstream.body?.cancel();
      return fail(
        502,
        "سرور API درخواست را تغییر مسیر داده است.",
        "UPSTREAM_REDIRECT",
      );
    }

    const responseHeaders = new Headers({
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-KKR-Request-Id": requestId,
      "X-KKR-Upstream-Status": String(upstream.status),
    });
    if (upstream.status >= 500) {
      responseHeaders.set(
        "X-KKR-Proxy-Error",
        "UPSTREAM_HTTP_" + upstream.status,
      );
      console.error("KKR_BACKEND_PROXY_UPSTREAM_ERROR", {
        requestId,
        method: request.method,
        path: target.pathname,
        status: upstream.status,
        elapsedMs: Date.now() - started,
      });
      if (
        !(upstream.headers.get("content-type") || "").includes(
          "application/json",
        )
      ) {
        await upstream.body?.cancel();
        return fail(
          upstream.status,
          "سرور لاراول یا وب‌سرور آن پاسخ خطا داد.",
          "UPSTREAM_HTTP_" + upstream.status,
        );
      }
    }
    stage = "forward-response";
    for (const name of [
      "content-type",
      "content-disposition",
      "retry-after",
      "content-range",
      "accept-ranges",
      "etag",
      "last-modified",
    ]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    const cookies = upstream.headers.getSetCookie();
    const upstreamCache = upstream.headers.get("cache-control") || "";
    const maxAge = Number(
      upstreamCache.match(/(?:^|,)\s*max-age=(\d+)/i)?.[1] || 0,
    );
    if (
      publicMedia &&
      !authenticatedMedia &&
      [200, 304].includes(upstream.status) &&
      /(?:^|,)\s*public\s*(?:,|$)/i.test(upstreamCache) &&
      !/\b(private|no-store|no-cache)\b/i.test(upstreamCache) &&
      !cookies.length &&
      maxAge > 0
    ) {
      const seconds = Math.min(maxAge, 60);
      responseHeaders.set(
        "Cache-Control",
        `public, max-age=${seconds}, s-maxage=${seconds}`,
      );
    }
    for (const cookie of cookies) {
      const hostCookie = cookie
        .replace(/;\s*Domain=[^;]*/gi, "")
        .replace(/;\s*Path=[^;]*/gi, "");
      responseHeaders.append("Set-Cookie", hostCookie + "; Path=/");
    }
    if (write && path[2] === "admin" && upstream.ok) {
      try {
        revalidateTag(PUBLIC_API_CACHE_TAG, { expire: 0 });
      } catch {
        console.error("KKR_PUBLIC_CACHE_INVALIDATION_ERROR", { requestId });
      }
    }
    const empty =
      request.method === "HEAD" || [204, 205, 304].includes(upstream.status);
    return new Response(empty ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const fault = backendFault(error);
    console.error("KKR_BACKEND_PROXY_ERROR", {
      requestId,
      method: request.method,
      path: target.pathname,
      backendHost: backend.host,
      stage,
      elapsedMs: Date.now() - started,
      code: fault.code,
    });
    return fail(fault.timeout ? 504 : 502, fault.message, fault.code);
  }
}

export {
  proxy as DELETE,
  proxy as GET,
  proxy as HEAD,
  proxy as OPTIONS,
  proxy as PATCH,
  proxy as POST,
  proxy as PUT,
};
