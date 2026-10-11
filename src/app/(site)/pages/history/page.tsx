import { PageTitle } from "@/components/common";
import { ShareButton } from "@/components/share-button";
import { getTranslations } from "@/lib/i18n-server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return {
    title: t("تاریخچه کانون"),
    description: t(
      "پیشینه کانون کارشناسان رسمی دادگستری در کشور و استان مازندران",
    ),
  };
}
const persian = [
  "فعالیت کارشناسان رسمی دادگستری در سطح کشور به حدود ۷۰ سال پیش می‌رسد، به‌طوری‌که در سال‌های دهه ۲۰ کارشناسان رسمی دادگستری با دادگاه‌ها همکاری تنگاتنگ داشته‌اند و برای اولین بار در بهمن ۱۳۱۷ قانون کارشناسان رسمی دادگستری تصویب و در سال ۱۳۳۹ همگام با پیشرفت‌های تکنولوژیکی و ضرورت آن در دادگاه‌ها اصلاحاتی به عمل آمد، تا اینکه در آبان ۱۳۵۸ با استقرار نظام جمهوری اسلامی در راستای تعمیم و گسترش عدالت در جامعه اسلامی نیاز به خدمات متخصصین کارشناس به عنوان بازوی توانمند دستگاه قضائی احساس شد.",
  "با توصیه شهید دکتر بهشتی در اول آبان ۱۳۵۸ لایحه قانونی مربوط به استقلال کانون کارشناسان رسمی در شورای‌عالی محترم انقلاب اسلامی که امر قانون‌گذاری را بر عهده داشت به تصویب رسید. با افزایش تخصص‌ها و تعدد کارشناسان، در جلسه ۱۳۸۱/۰۱/۱۷ مجلس محترم شورای اسلامی و در تاریخ ۱۳۸۱/۰۱/۲۱ شورای محترم نگهبان قانون جدید را تصویب و طی نامه شماره ۱۹۹۹ مورخه ۱۳۸۱/۰۲/۰۳ آن را جهت اجرا به دولت ابلاغ نمود.",
  "با اجرای قانون جدید، کانون‌های کارشناسان رسمی در بسیاری از استان‌ها به صورت مستقل تشکیل و کانون کارشناسان رسمی دادگستری مازندران ابتدا از سال ۱۳۷۴ لغایت ۱۳۷۸/۰۴/۳۰ به صورت نمایندگی مازندران و گرگان اداره می‌شده و سپس پنجمین استانی بود که بر اساس قانون جدید در تاریخ ۱۳۷۸/۰۴/۳۰ با تعداد ۵۳ نفر کارشناس تأسیس گردید.",
  "سایت کانون کارشناسان رسمی دادگستری مازندران برای تسهیل دسترسی مقامات مراجع محترم قضائی و نیز مسئولان محترم اداری استان و متقاضیان کارشناسی در بخش خصوصی فعال است که می‌توانند از آخرین اطلاعات موجود در آن بهره گیرند.",
  "در خاتمه جا دارد از حمایت‌ها و مساعدت‌های صمیمانه رؤسای کل دادگستری استان، به‌ویژه رئیس کل محترم دادگستری استان مازندران و نیز مسئولین و رؤسای محترم دادگاه‌ها در شعب مختلف شهرستان و استان صمیمانه تقدیر و تشکر نماییم.",
];
const english = [
  "According to the council’s historical account, official justice experts have worked in Iran for about seventy years, cooperating closely with courts during the 1320s in the Solar Hijri calendar. The first law governing official justice experts was approved in Bahman 1317 and amended in 1339 to reflect technological advances and the needs of the courts. In Aban 1358, following the establishment of the Islamic Republic, specialist experts were recognised as an important source of professional support for the judiciary and the wider administration of justice.",
  "On the recommendation of Dr Beheshti, a legal bill concerning the independence of the Official Experts Council was approved on 1 Aban 1358 by the Supreme Council of the Islamic Revolution, which then held legislative authority. As specialisations and the number of experts increased, a new law was approved by the Islamic Consultative Assembly on 1381/01/17 and by the Guardian Council on 1381/01/21. It was communicated to the government for implementation through letter No. 1999 dated 1381/02/03. The dates in this account use the Solar Hijri calendar.",
  "With the implementation of the new law, independent experts councils were established in many provinces. The Mazandaran Official Justice Experts Council initially operated as the Mazandaran and Gorgan representative office from 1374 until 1378/04/30. Mazandaran then became the fifth province to establish its own council, on 1378/04/30, with 53 experts.",
  "The Mazandaran Official Justice Experts Council website helps judicial authorities, provincial administrative officials and private-sector applicants access the latest information about the council and its expert services.",
  "The council expresses its appreciation for the support of the provincial judiciary’s chief justices, particularly the Chief Justice of Mazandaran, and the officials and heads of courts across the province and its towns.",
];
export default async function HistoryPage() {
  const { locale, t } = await getTranslations();
  const paragraphs = locale === "en" ? english : persian;
  return (
    <div className="page-container inner-page">
      <PageTitle title={t("تاریخچه کانون")} />
      <article className="detail-panel history-content">
        <ShareButton title={t("تاریخچه کانون")} />
        <h2>
          {t("پیشینه کانون کارشناسان رسمی دادگستری در کشور و استان مازندران")}
        </h2>
        {paragraphs.slice(0, 3).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        <figure className="history-image">
          <img
            src="/assets/history-kanoon.jpg"
            alt={t("کانون کارشناسان رسمی دادگستری مازندران")}
            loading="lazy"
          />
        </figure>
        {paragraphs.slice(3).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        <a
          href="https://www.kkrm.ir/"
          target="_blank"
          rel="noopener noreferrer"
        >
          www.kkrm.ir
        </a>
      </article>
    </div>
  );
}
