import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ApiError } from "./errors";
import { backendFetch, backendFault } from "./backend-http";
import type { ApiResponse, User } from "./types";

const origin = (process.env.API_URL || "http://localhost:8000").replace(
  /\/$/,
  "",
);
export async function serverApi<T>(
  path: string,
  privateRequest = false,
): Promise<ApiResponse<T>> {
  if (!path.startsWith("/api/v1/") || /[\\\u0000-\u001f]/.test(path))
    throw new Error("مسیر معتبر نیست.");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (privateRequest) {
    headers.Cookie = (await cookies()).toString();
    headers.Origin = new URL(
      process.env.SITE_URL || "http://localhost:3000",
    ).origin;
    headers.Referer = headers.Origin + "/";
  }
  const started = Date.now();
  let response: Response;
  try {
    response = await backendFetch(origin + path, { headers });
  } catch (error) {
    const fault = backendFault(error);
    if (
      fault.code !== "BACKEND_FETCH_FAILED" ||
      fault.timeout ||
      error instanceof TypeError
    ) {
      console.error("KKR_SERVER_API_ERROR", {
        path,
        code: fault.code,
        elapsedMs: Date.now() - started,
      });
    }
    throw error;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("KKR_SERVER_API_HTTP_ERROR", {
      path,
      status: response.status,
      elapsedMs: Date.now() - started,
    });
    throw new ApiError(
      response.status,
      payload.message || "دریافت اطلاعات ناموفق بود.",
      payload.errors || {},
    );
  }
  if (payload.success !== true || !("data" in payload)) {
    console.error("KKR_SERVER_API_INVALID_RESPONSE", {
      path,
      status: response.status,
      contentType: response.headers.get("content-type"),
    });
    throw new ApiError(
      502,
      "پاسخ API معتبر نیست. آدرس و اجرای سرور لاراول را بررسی کنید.",
    );
  }
  return payload as ApiResponse<T>;
}
export const currentUser = cache(async (): Promise<User> => {
  try {
    return (await serverApi<User>("/api/v1/auth/me", true)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      redirect("/admin/login");
    throw error;
  }
});
