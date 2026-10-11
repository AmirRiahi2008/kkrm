import Link from "@/components/localized-link";
import { getTranslations } from "@/lib/i18n-server";
import { number } from "@/lib/i18n";

export default async function NotFound() {
  const { locale, t } = await getTranslations();
  return (
    <main className="error-page">
      <strong className="error-number">{number(404, locale)}</strong>
      <h1>{t("این صفحه پیدا نشد")}</h1>
      <p>{t("ممکن است نشانی تغییر کرده باشد یا محتوا منتشر نشده باشد.")}</p>
      <Link prefetch={false} href="/" className="primary-button">
        {t("صفحه اصلی")}
      </Link>
    </main>
  );
}
