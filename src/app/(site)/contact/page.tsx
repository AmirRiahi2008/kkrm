import { serverApi } from "@/lib/api-server";
import { PageTitle } from "@/components/common";
import { ContactForm } from "@/components/contact-form";
import type { SiteSettings } from "@/lib/types";

export const metadata = { title: "تماس با ما" };
export default async function Contact() {
  const { data } = await serverApi<SiteSettings>("/api/v1/settings");
  return (
    <div className="page-container inner-page">
      <PageTitle title="تماس با ما" />
      <div className="contact-layout">
        <aside className="detail-panel">
          <h2>راه‌های ارتباطی</h2>
          <p>{data.site_address}</p>
          <p>
            تلفن:{" "}
            <a href={"tel:" + (data.site_phone || "").replace(/[^+\d]/g, "")}>
              {data.site_phone}
            </a>
          </p>
          <p>
            ایمیل: <a href={"mailto:" + data.site_email}>{data.site_email}</a>
          </p>
          <p>{data.office_hours}</p>
          <LinkToMap />
        </aside>
        <section className="detail-panel">
          <h2>ارسال پیام به کانون</h2>
          <ContactForm />
        </section>
      </div>
    </div>
  );
}
function LinkToMap() {
  return (
    <a
      className="source-link"
      href="https://www.google.com/maps/search/?api=1&query=کانون+کارشناسان+رسمی+دادگستری+مازندران+ساری"
      target="_blank"
      rel="noopener noreferrer"
    >
      مشاهده موقعیت در نقشه ↗
    </a>
  );
}
