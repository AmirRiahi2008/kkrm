import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ path: string[] }>;
};

async function proxy(request: NextRequest, context: Context) {
  const { path } = await context.params;

  const invalidSegment = path.some(
    (segment) =>
      !segment ||
      segment === "." ||
      segment === ".." ||
      /[/\\\u0000-\u001f]/.test(segment),
  );

  const apiPath = path[0] === "api" && path[1] === "v1";
  const csrfPath =
    path.length === 2 &&
    path[0] === "sanctum" &&
    path[1] === "csrf-cookie";

  if (invalidSegment || (!apiPath && !csrfPath)) {
    return Response.json(
      { message: "مسیر معتبر نیست." },
      { status: 404 },
    );
  }

  const write = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  const requestOrigin = new URL(request.url).origin;
  const suppliedOrigin = request.headers.get("origin");

  if (
    write &&
    (
      suppliedOrigin !== requestOrigin ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
  ) {
    return Response.json(
      { message: "مبدأ درخواست معتبر نیست." },
      { status: 403 },
    );
  }

  const apiUrl = process.env.API_URL;
  const siteUrl = process.env.SITE_URL;

  if (!apiUrl || !siteUrl) {
    return Response.json(
      { message: "تنظیمات اتصال سرور کامل نیست." },
      { status: 503 },
    );
  }

  try {
    const backend = new URL(apiUrl);
    const site = new URL(siteUrl);

    if (!["http:", "https:"].includes(backend.protocol)) {
      throw new Error("Invalid backend protocol");
    }

    const target = new URL(
      "/" + path.map(encodeURIComponent).join("/"),
      backend.origin,
    );

    target.search = request.nextUrl.search;

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
    ]) {
      const value = request.headers.get(name);

      if (value) {
        headers.set(name, value);
      }
    }

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: write ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(45000),
    });

    if (upstream.status >= 300 && upstream.status < 400) {
      await upstream.body?.cancel();

      return Response.json(
        { message: "API نباید درخواست را تغییر مسیر دهد." },
        { status: 502 },
      );
    }

    const responseHeaders = new Headers({
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });

    for (const name of ["content-type", "content-disposition", "retry-after"]) {
      const value = upstream.headers.get(name);

      if (value) {
        responseHeaders.set(name, value);
      }
    }

    for (const cookie of upstream.headers.getSetCookie()) {
      const hostCookie = cookie
        .replace(/;\s*Domain=[^;]*/gi, "")
        .replace(/;\s*Path=[^;]*/gi, "");

      responseHeaders.append("Set-Cookie", hostCookie + "; Path=/");
    }

    const empty =
      request.method === "HEAD" ||
      upstream.status === 204 ||
      upstream.status === 205 ||
      upstream.status === 304;

    return new Response(empty ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { message: "ارتباط با سرور لاراول برقرار نشد." },
      { status: 502 },
    );
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