import "server-only";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { backendFault, backendFetch } from "./backend-http";
import { ApiError } from "./errors";
import { getLocale } from "./i18n-server";
import { cacheablePublicPath, PUBLIC_API_CACHE_TAG } from "./public-cache";
import type { ApiResponse, User } from "./types";

function apiOrigin(): string {
  const url = new URL(process.env.API_URL || "http://localhost:8000");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("API_URL must be an HTTP origin without a path.");
  }
  return url.origin;
}

export function publicApiUnavailable(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status >= 500 || error.status === 429 || error.status === 408)
  );
}

async function readApi(
  origin: string,
  path: string,
  headers: Record<string, string>,
  timeoutMs = 25000,
): Promise<ApiResponse<unknown>> {
  const started = Date.now();
  let response: Response;
  let payload: unknown;

  try {
    response = await backendFetch(origin + path, { headers }, { timeoutMs });
    payload = await response.json().catch((error: unknown) => {
      if (!response.ok) return {};
      throw error;
    });
  } catch (error) {
    const fault = backendFault(error);
    console.error("KKR_SERVER_API_ERROR", {
      path,
      code: error instanceof SyntaxError ? "INVALID_JSON" : fault.code,
      elapsedMs: Date.now() - started,
    });
    throw new ApiError(
      fault.timeout ? 504 : 502,
      error instanceof SyntaxError
        ? "پاسخ سرور لاراول معتبر نیست."
        : fault.message,
    );
  }

  const object =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};

  if (!response.ok) {
    console.error("KKR_SERVER_API_HTTP_ERROR", {
      path,
      status: response.status,
      elapsedMs: Date.now() - started,
    });
    throw new ApiError(
      response.status,
      typeof object.message === "string"
        ? object.message
        : "دریافت اطلاعات ناموفق بود.",
      object.errors && typeof object.errors === "object"
        ? (object.errors as Record<string, string[]>)
        : {},
    );
  }

  if (object.success !== true || !("data" in object)) {
    console.error("KKR_SERVER_API_INVALID_RESPONSE", {
      path,
      status: response.status,
      contentType: response.headers.get("content-type"),
    });
    throw new ApiError(502, "پاسخ API معتبر نیست.");
  }

  return object as unknown as ApiResponse<unknown>;
}

const cachedPublicApi = unstable_cache(
  (origin: string, path: string) =>
    readApi(origin, path, { Accept: "application/json" }),
  ["kkr-public-api-v2"],
  { revalidate: 300, tags: [PUBLIC_API_CACHE_TAG] },
);

const readPublicApi = cache((origin: string, path: string) =>
  cacheablePublicPath(path)
    ? cachedPublicApi(origin, path)
    : readApi(origin, path, { Accept: "application/json" }),
);

export async function serverApi<T>(
  path: string,
  privateRequest = false,
): Promise<ApiResponse<T>> {
  if (
    !path.startsWith("/api/v1/") ||
    /[\\\u0000-\u001f]/.test(path) ||
    path.includes("#")
  ) {
    throw new Error("مسیر معتبر نیست.");
  }

  const origin = apiOrigin();
  const target = new URL(path, origin);
  const requiresSession = /^\/api\/v1\/(admin|auth)(\/|$)/.test(
    target.pathname,
  );
  privateRequest ||= requiresSession;

  if (privateRequest) {
    const site = new URL(process.env.SITE_URL || "http://localhost:3000");
    return (await readApi(
      origin,
      target.pathname + target.search,
      {
        Accept: "application/json",
        Cookie: (await cookies()).toString(),
        Origin: site.origin,
        Referer: site.origin + "/",
      },
      45000,
    )) as ApiResponse<T>;
  }

  target.searchParams.set("locale", await getLocale());
  target.searchParams.sort();
  return (await readPublicApi(
    origin,
    target.pathname + target.search,
  )) as ApiResponse<T>;
}

export const currentUser = cache(async (): Promise<User> => {
  try {
    return (await serverApi<User>("/api/v1/auth/me", true)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/admin/login");
    }
    throw error;
  }
});
