import { PageTitle } from "@/components/common";
import { FeeCalculator } from "@/components/fee-calculator";
import { PublicUnavailable } from "@/components/public-unavailable";
import { publicApiUnavailable, serverApi } from "@/lib/api-server";
import { getTranslations } from "@/lib/i18n-server";
import type { TariffVersion } from "@/lib/portal-types";
import "@/app/fee-calculator.css";

export async function generateMetadata() {
  const { locale } = await getTranslations();
  return {
    title:
      locale === "en"
        ? "Expert fee calculator"
        : "محاسبه تعرفه دستمزد کارشناسی",
  };
}

export default async function FeeCalculatorPage() {
  const { locale } = await getTranslations();
  let tariffs: TariffVersion[];
  try {
    tariffs = (await serverApi<TariffVersion[]>("/api/v1/tariffs?per_page=50"))
      .data;
  } catch (error) {
    if (!publicApiUnavailable(error)) throw error;
    return (
      <div className="page-container inner-page">
        <PageTitle
          title={
            locale === "en"
              ? "Expert fee calculator"
              : "محاسبه تعرفه دستمزد کارشناسی"
          }
        />
        <PublicUnavailable />
      </div>
    );
  }
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return (
    <div className="page-container inner-page">
      <PageTitle
        title={
          locale === "en"
            ? "Expert fee calculator"
            : "محاسبه تعرفه دستمزد کارشناسی"
        }
        description={
          locale === "en"
            ? "A transparent estimate using the council's recorded tariff"
            : "برآورد شفاف بر اساس نسخه تعرفه ثبت‌شده کانون"
        }
      />
      <FeeCalculator tariffs={tariffs} today={today} />
    </div>
  );
}
