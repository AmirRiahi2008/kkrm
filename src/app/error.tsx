"use client";

import Link from "@/components/localized-link";
import { useLocale } from "@/components/locale-provider";
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
  const { t } = useLocale();
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
      <h1>{t("دریافت اطلاعات انجام نشد")}</h1>
      <p>{t("اتصال به سرور را بررسی کنید و دوباره تلاش کنید.")}</p>
      {digest && (
        <p>
          {t("شناسه خطا:")} <bdi>{digest}</bdi>
        </p>
      )}
      <button type="button" className="primary-button" onClick={tryAgain}>
        {t("تلاش دوباره")}
      </button>
      <Link prefetch={false} href="/">
        {t("بازگشت به صفحه اصلی")}
      </Link>
    </main>
  );
}
