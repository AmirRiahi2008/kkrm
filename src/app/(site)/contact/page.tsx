import { PageTitle } from "@/components/common";
import { ContactForm } from "@/components/contact-form";
import { PublicUnavailable } from "@/components/public-unavailable";
import { getTranslations } from "@/lib/i18n-server";
import { siteSettings } from "@/lib/site-shell";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("تماس با ما") };
}
export default async function Contact() {
  const { t } = await getTranslations();
  const { data, unavailable } = await siteSettings();
  return (
    <div className="page-container inner-page">
      <PageTitle title={t("تماس با ما")} />
      <div className="contact-layout">
        <aside className="detail-panel">
          <h2>{t("راه‌های ارتباطی")}</h2>
          {unavailable && <PublicUnavailable compact />}
          <p>{data.site_address}</p>
          {data.site_phone && (
            <p>
              {t("تلفن:")}{" "}
              <a href={"tel:" + (data.site_phone || "").replace(/[^+\d]/g, "")}>
                {data.site_phone}
              </a>
            </p>
          )}
          {data.site_email && (
            <p>
              {t("ایمیل:")}{" "}
              <a href={"mailto:" + data.site_email}>{data.site_email}</a>
            </p>
          )}
          <p>{data.office_hours}</p>
          <LinkToMap />
        </aside>
        <section className="detail-panel">
          <h2>{t("ارسال پیام به کانون")}</h2>
          <ContactForm />
        </section>
      </div>
    </div>
  );
}
async function LinkToMap() {
  const { t } = await getTranslations();
  return (
    <a
      className="source-link"
      href="https://www.google.com/maps/search/?api=1&query=کانون+کارشناسان+رسمی+دادگستری+مازندران+ساری"
      target="_blank"
      rel="noopener noreferrer"
    >
      {t("مشاهده موقعیت در نقشه ↗")}
    </a>
  );
}
