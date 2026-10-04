"use client";

import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <h1>دریافت اطلاعات انجام نشد</h1>
      <p>اتصال به سرور را بررسی کنید و دوباره تلاش کنید.</p>
      <button className="primary-button" onClick={reset}>
        تلاش دوباره
      </button>
      <Link prefetch={false} href="/">
        بازگشت به صفحه اصلی
      </Link>
    </main>
  );
}
