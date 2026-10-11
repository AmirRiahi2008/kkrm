import "server-only";
import { cache } from "react";
import { publicApiUnavailable, serverApi } from "./api-server";
import { ApiError } from "./errors";
import { translate } from "./i18n";
import { getLocale } from "./i18n-server";
import type { Menu, SiteSettings } from "./types";

function missingShell(error: unknown): boolean {
  return (
    publicApiUnavailable(error) ||
    (error instanceof ApiError && error.status === 404)
  );
}

function defaultNavigation(): Record<string, Menu[]> {
  let id = 0;
  const menu = (
    title: string,
    url: string | null,
    children: Menu[] = [],
  ): Menu => ({
    id: --id,
    title,
    url,
    children,
    open_new_tab: false,
  });
  const header = [
    menu("اخبار و مقاله‌ها", null, [
      menu("اخبار", "/news"),
      menu("مقاله‌ها", "/articles"),
      menu("اطلاعیه‌ها", "/news?type=announcement"),
      menu("مصوبات", "/news?type=resolution"),
    ]),
    menu("درباره کانون", null, [
      menu("تاریخچه کانون", "/pages/history"),
      menu("اعضای هیئت مدیره و ارکان", "/board-members"),
      menu("رؤسای پیشین کانون", "/board-members?role=former_president"),
    ]),
    menu("قوانین و مقررات", null, [
      menu("قوانین و اسناد", "/documents"),
      menu("قانون کارشناسان رسمی دادگستری", "/documents/experts-law"),
      menu("فرم‌های مورد نیاز", "/documents?type=form"),
      menu("تعرفه دستمزد", "/documents?type=tariff"),
    ]),
    menu("امور کارشناسان", null, [
      menu("جستجوی کارشناس", "/experts"),
      menu("گروه‌های دوازده‌گانه کارشناسی", "/expert-groups"),
      menu("رویدادهای کانون", "/events"),
      menu("شماره حساب کانون", "/bank-accounts"),
      menu("قراردادها و تفاهم‌نامه‌ها", "/agreements"),
    ]),
    menu("گالری تصاویر", "/albums"),
    menu("سامانه‌ها", "/systems"),
  ];
  return { header, mobile: header, footer: [] };
}

export const siteSettings = cache(
  async (): Promise<{ data: SiteSettings; unavailable: boolean }> => {
    const locale = await getLocale();
    try {
      const { data } = await serverApi<SiteSettings>("/api/v1/settings");
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new ApiError(502, "پاسخ تنظیمات سایت معتبر نیست.");
      }
      return { data, unavailable: false };
    } catch (error) {
      if (!missingShell(error)) throw error;
      return {
        data: {
          site_name: translate(
            locale,
            "کانون کارشناسان رسمی دادگستری مازندران",
          ),
          announcement_ticker: translate(locale, "سرمایه گذاری برای تولید"),
        } satisfies SiteSettings,
        unavailable: true,
      };
    }
  },
);

export const siteNavigation = cache(
  async (): Promise<{ data: Record<string, Menu[]>; unavailable: boolean }> => {
    try {
      const { data } =
        await serverApi<Record<string, Menu[]>>("/api/v1/navigation");
      if (!data || !Array.isArray(data.header) || !Array.isArray(data.footer)) {
        throw new ApiError(502, "پاسخ منوهای سایت معتبر نیست.");
      }
      return { data, unavailable: false };
    } catch (error) {
      if (!missingShell(error)) throw error;
      return { data: defaultNavigation(), unavailable: true };
    }
  },
);
