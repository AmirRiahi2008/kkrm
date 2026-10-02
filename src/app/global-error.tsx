"use client";

import { useEffect } from "react";
import { resetLoading } from "@/lib/loading-store";

export default function GlobalError({
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
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          background: "#f8fafc",
          color: "#17202a",
          fontFamily: "Tahoma, sans-serif",
        }}
      >
        <main
          role="alert"
          style={{
            maxWidth: 600,
            margin: "80px auto",
            padding: 24,
            textAlign: "center",
            lineHeight: 2,
          }}
        >
          <h1>بارگذاری سایت انجام نشد</h1>
          <p>خطایی در سرور رخ داده است. دوباره تلاش کنید.</p>
          {digest && (
            <p>
              شناسه خطا: <bdi>{digest}</bdi>
            </p>
          )}
          <button
            type="button"
            onClick={tryAgain}
            style={{
              padding: "12px 24px",
              border: 0,
              borderRadius: 10,
              background: "#00477a",
              color: "#fff",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            تلاش دوباره
          </button>
        </main>
      </body>
    </html>
  );
}
