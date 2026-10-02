import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { backendFetch, backendFault } from "@/lib/backend-http";

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
  const requestOrigin = new URL(request.url).origin;
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
      "range",
      "if-range",
    ]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    stage = "fetch-backend";
    const upstream = await backendFetch(target, {
      method: request.method,
      headers,
      body,
      signal: request.signal,
    });

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
    ]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) {
      const hostCookie = cookie
        .replace(/;\s*Domain=[^;]*/gi, "")
        .replace(/;\s*Path=[^;]*/gi, "");
      responseHeaders.append("Set-Cookie", hostCookie + "; Path=/");
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
  proxy as GET,
  proxy as HEAD,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
  proxy as OPTIONS,
};
