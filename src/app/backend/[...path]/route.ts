import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Context = {
  params: Promise<{ path: string[] }>;
};

function errorDetails(error: unknown) {
  if (!(error instanceof Error)) return { message: "Unknown error" };

  const cause = error.cause as
    | { code?: string; message?: string; errors?: Error[] }
    | undefined;

  return {
    name: error.name,
    message: error.message,
    causeCode: cause?.code,
    causeMessage: cause?.message,
    nested: cause?.errors?.map((item) => ({
      message: item.message,
      code: (item as Error & { code?: string }).code,
    })),
  };
}

async function proxy(request: NextRequest, context: Context) {
  const started = Date.now();
  const { path } = await context.params;

  const invalidSegment = path.some(
    (segment) => !segment || segment === "." || segment === ".." ||
      /[/\\\u0000-\u001f]/.test(segment),
  );

  const apiPath = path.length >= 3 && path[0] === "api" && path[1] === "v1";
  const csrfPath = path.length === 2 && path[0] === "sanctum" && path[1] === "csrf-cookie";

  if (invalidSegment || (!apiPath && !csrfPath)) {
    return Response.json({ success: false, message: "مسیر معتبر نیست." }, { status: 404 });
  }

  const write = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  const requestOrigin = new URL(request.url).origin;

  if (write && (
    request.headers.get("origin") !== requestOrigin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )) {
    return Response.json({ success: false, message: "مبدأ درخواست معتبر نیست." }, { status: 403 });
  }

  let backend: URL;
  let site: URL;

  try {
    backend = new URL(process.env.API_URL || "");
    site = new URL(process.env.SITE_URL || "");

    if (
      !["http:", "https:"].includes(backend.protocol) ||
      !["http:", "https:"].includes(site.protocol) ||
      backend.username || backend.password || site.username || site.password
    ) {
      throw new Error("Invalid API_URL or SITE_URL");
    }
  } catch {
    console.error("KKR_BACKEND_PROXY_CONFIG_ERROR", { apiUrlConfigured: Boolean(process.env.API_URL), siteUrlConfigured: Boolean(process.env.SITE_URL) });

    return Response.json({ success: false, message: "تنظیمات اتصال سرور کامل یا معتبر نیست." }, { status: 503 });
  }

  const target = new URL("/" + path.map(encodeURIComponent).join("/"), backend.origin);
  target.search = request.nextUrl.search;
  let stage = "read-request";

  try {
    const headers = new Headers({ Accept: "application/json", Origin: site.origin, Referer: site.origin + "/" });

    for (const name of ["cookie", "content-type", "x-xsrf-token", "x-requested-with"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    const body = write ? await request.arrayBuffer() : undefined;
    stage = "fetch-backend";

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(45000),
    });

    if (upstream.status >= 300 && upstream.status < 400) {
      console.error("KKR_BACKEND_PROXY_REDIRECT", { method: request.method, path: target.pathname, status: upstream.status });
      await upstream.body?.cancel();

      return Response.json({ success: false, message: "سرور API درخواست را تغییر مسیر داده است." }, { status: 502 });
    }

    if (upstream.status >= 500) {
      console.error("KKR_BACKEND_PROXY_UPSTREAM_ERROR", { method: request.method, path: target.pathname, status: upstream.status, elapsedMs: Date.now() - started });
    }

    stage = "forward-response";
    const responseHeaders = new Headers({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" });

    for (const name of ["content-type", "content-disposition", "retry-after"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    for (const cookie of upstream.headers.getSetCookie()) {
      const hostCookie = cookie
        .replace(/;\s*Domain=[^;]*/gi, "")
        .replace(/;\s*Path=[^;]*/gi, "");

      responseHeaders.append("Set-Cookie", hostCookie + "; Path=/");
    }

    const empty = request.method === "HEAD" || [204, 205, 304].includes(upstream.status);

    return new Response(empty ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const timeout = error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);

    console.error("KKR_BACKEND_PROXY_ERROR", {
      method: request.method,
      path: target.pathname,
      backendHost: backend.host,
      stage,
      elapsedMs: Date.now() - started,
      ...errorDetails(error),
    });

    return Response.json({
      success: false,
      message: timeout ? "زمان انتظار برای پاسخ سرور لاراول تمام شد." : "ارتباط با سرور لاراول برقرار نشد.",
    }, { status: timeout ? 504 : 502 });
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
