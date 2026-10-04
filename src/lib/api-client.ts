"use client";

import { ApiError } from "./errors";
import type { ApiResponse } from "./types";

const origin = "/backend";
let csrfPromise: Promise<void> | null = null;

function token(): string | undefined {
  const cookie = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("XSRF-TOKEN="));

  if (!cookie) return undefined;

  try {
    return decodeURIComponent(cookie.slice("XSRF-TOKEN=".length));
  } catch {
    return undefined;
  }
}

async function csrf(): Promise<void> {
  csrfPromise ??= fetch(origin + "/sanctum/csrf-cookie", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        const payload = await response.json().catch(() => null);

        throw new ApiError(
          response.status,
          payload?.message || "دریافت نشست امن ناموفق بود.",
        );
      }
    })
    .finally(() => {
      csrfPromise = null;
    });

  await csrfPromise;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<ApiResponse<T>> {
  if (
    !path.startsWith("/api/v1/") ||
    /[\\\u0000-\u001f]/.test(path)
  ) {
    throw new Error("مسیر معتبر نیست.");
  }

  const method = (options.method || "GET").toUpperCase();
  const write = !["GET", "HEAD", "OPTIONS"].includes(method);

  if (write && !token()) {
    await csrf();
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Requested-With", "XMLHttpRequest");

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (write) {
    const xsrf = token();

    if (!xsrf) {
      throw new ApiError(
        419,
        "کوکی امنیتی دریافت نشد. تنظیمات کوکی سرور را بررسی کنید.",
      );
    }

    headers.set("X-XSRF-TOKEN", xsrf);
  }

  const response = await fetch(origin + path, {
    ...options,
    method,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });

  if (response.status === 419 && retry) {
    await csrf();
    return api<T>(path, options, false);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const publicAuthPages = [
      "/admin/login",
      "/admin/forgot-password",
      "/admin/reset-password",
    ];

    const authPage = publicAuthPages.some(
      (page) =>
        window.location.pathname === page ||
        window.location.pathname.startsWith(page + "/"),
    );

    if (
      response.status === 401 &&
      window.location.pathname.startsWith("/admin") &&
      !authPage
    ) {
      window.location.assign(
  new URL("/admin/login", window.location.origin).href,
);
    }

    throw new ApiError(
      response.status,
      payload?.message || "درخواست انجام نشد.",
      payload?.errors || {},
    );
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    payload.success !== true ||
    !("data" in payload)
  ) {
    throw new ApiError(
      502,
      "پاسخ API معتبر نیست. اتصال به لاراول را بررسی کنید.",
    );
  }

  return payload as ApiResponse<T>;
}