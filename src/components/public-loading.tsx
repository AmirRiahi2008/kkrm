import { getTranslations } from "@/lib/i18n-server";

export async function PublicLoading() {
  const { t } = await getTranslations();

  return (
    <div
      className="public-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="global-loading-spinner" aria-hidden="true" />
      <strong className="loading-council-name">
        {t("کانون کارشناسان رسمی دادگستری مازندران")}
      </strong>
      <span>{t("در حال دریافت اطلاعات…")}</span>
    </div>
  );
}
