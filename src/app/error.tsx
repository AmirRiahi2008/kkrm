"use client";

import Link from "next/link";
import { useEffect } from "react";
import { resetLoading } from "@/lib/loading-store";

export default function ErrorPage({
  error,
  retry,
  reset,
}: {
  error: unknown;
  retry?: () => void;
  reset?: () => void;
}) {
  const digest =
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : "";

  useEffect(() => {
    resetLoading();
  }, [error]);

  function tryAgain() {
    resetLoading();
    if (retry) retry();
    else if (reset) reset();
    else window.location.reload();
  }

  return (
    <main className="error-page" role="alert">
      <h1>دریافت اطلاعات انجام نشد</h1>
      <p>اتصال به سرور را بررسی کنید و دوباره تلاش کنید.</p>
      {digest && (
        <p>
          شناسه خطا: <bdi>{digest}</bdi>
        </p>
      )}
      <button type="button" className="primary-button" onClick={tryAgain}>
        تلاش دوباره
      </button>
      <Link prefetch={false} href="/">
        بازگشت به صفحه اصلی
      </Link>
    </main>
  );
}
