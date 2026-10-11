"use client";

import { ApiError, errorMessage } from "./errors";
import { translate } from "./i18n";
import { notify } from "./toast-store";

import type { ApiResponse } from "./types";

const origin = "/backend";
let csrfPromise: Promise<void> | null = null;

function token(): string | undefined {
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("XSRF-TOKEN="));
  if (!value) return undefined;
  try {
    return decodeURIComponent(value.slice(11));
  } catch {
    return undefined;
  }
}
async function csrf(signal?: AbortSignal | null) {
  csrfPromise ??= fetch(origin + "/sanctum/csrf-cookie", {
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  })
    .then((response) => {
      if (!response.ok)
        throw new ApiError(response.status, "دریافت نشست امن ناموفق بود.");
    })
    .finally(() => {
      csrfPromise = null;
    });
  if (!signal) {
    await csrfPromise;
    return;
  }
  signal.throwIfAborted();
  await new Promise<void>((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    csrfPromise!.then(
      () => {
        signal.removeEventListener("abort", abort);
        resolve();
      },
      (error: unknown) => {
        signal.removeEventListener("abort", abort);
        reject(error);
      },
    );
  });
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
  if (write && !token()) await csrf(options.signal);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set(
    "X-Site-Locale",
    document.documentElement.lang === "en" ? "en" : "fa",
  );
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
    await csrf(options.signal);
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
  const signals = [AbortSignal.timeout(60000)];
  if (options.signal) signals.push(options.signal);
  const signal = AbortSignal.any(signals);
  const write = !["GET", "HEAD", "OPTIONS"].includes(
    (options.method || "GET").toUpperCase(),
  );
  const silent =
    path.includes("/notifications") || path === "/api/v1/tariffs/calculate";
  const locale = document.documentElement.lang === "en" ? "en" : "fa";
  return apiRequest<T>(path, { ...options, signal }, retry)
    .then((result) => {
      if (write && !silent) {
        const method = (options.method || "POST").toUpperCase();
        const message =
          method === "DELETE"
            ? "مورد با موفقیت حذف شد."
            : path === "/api/v1/contact"
              ? "پیام شما ثبت شد."
              : path === "/api/v1/auth/login"
                ? "ورود با موفقیت انجام شد."
                : path === "/api/v1/auth/logout"
                  ? "از حساب خارج شدید."
                  : path.includes("/media")
                    ? "فایل با موفقیت بارگذاری شد."
                    : "تغییرات با موفقیت ذخیره شد.";
        notify(translate(locale, message));
      }
      return result;
    })
    .catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        error = new ApiError(
          504,
          "زمان انتظار برای پاسخ سرور تمام شد. وضعیت ذخیره را بررسی کنید و دوباره تلاش کنید.",
        );
      }
      if (
        write &&
        !silent &&
        !(error instanceof DOMException && error.name === "AbortError")
      )
        notify(translate(locale, errorMessage(error)), "error");
      throw error;
    });
}
