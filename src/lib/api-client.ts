"use client";

import { ApiError } from "./errors";
import { withLoading } from "./loading-store";
import type { ApiResponse } from "./types";

const origin = "/backend";
let csrfPromise: Promise<void> | null = null;

function token(): string | undefined {
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("XSRF-TOKEN="));
  return value ? decodeURIComponent(value.slice(11)) : undefined;
}
async function csrf() {
  csrfPromise ??= fetch(origin + "/sanctum/csrf-cookie", {
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
    .then((response) => {
      if (!response.ok)
        throw new ApiError(response.status, "دریافت نشست امن ناموفق بود.");
    })
    .finally(() => {
      csrfPromise = null;
    });
  await csrfPromise;
}
async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<ApiResponse<T>> {
  if (!path.startsWith("/api/v1/") || /[\\\u0000-\u001f]/.test(path))
    throw new Error("مسیر معتبر نیست.");
  const method = (options.method || "GET").toUpperCase();
  const write = !["GET", "HEAD", "OPTIONS"].includes(method);
  if (write && !token()) await csrf();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (write) {
    const xsrf = token();
    if (!xsrf)
      throw new ApiError(
        419,
        "دریافت کوکی نشست انجام نشد. صفحه را دوباره بارگذاری کنید.",
      );
    headers.set("X-XSRF-TOKEN", xsrf);
  }
  const response = await fetch(origin + path, {
    ...options,
    method,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  if (response.status === 419 && retry) {
    await csrf();
    return apiRequest<T>(path, options, false);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (
      response.status === 401 &&
      window.location.pathname.startsWith("/admin") &&
      !window.location.pathname.startsWith("/admin/login")
    ) {
      window.location.assign(
        new URL("/admin/login", window.location.origin).href,
      );
    }
    throw new ApiError(
      response.status,
      payload.message || "درخواست انجام نشد.",
      payload.errors || {},
    );
  }
  if (payload.success !== true || !("data" in payload)) {
    throw new ApiError(
      502,
      "پاسخ API معتبر نیست. آدرس و اجرای سرور لاراول را بررسی کنید.",
    );
  }
  return payload as ApiResponse<T>;
}

export function api<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<ApiResponse<T>> {
  return withLoading(() => apiRequest<T>(path, options, retry));
}
