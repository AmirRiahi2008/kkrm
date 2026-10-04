import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-page">
      <strong className="error-number">۴۰۴</strong>
      <h1>این صفحه پیدا نشد</h1>
      <p>ممکن است نشانی تغییر کرده باشد یا محتوا منتشر نشده باشد.</p>
      <Link prefetch={false} href="/" className="primary-button">
        صفحه اصلی
      </Link>
    </main>
  );
}
