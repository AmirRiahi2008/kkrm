import Link from "@/components/localized-link";
import { publicApiUnavailable, serverApi } from "@/lib/api-server";
import { ApiError } from "@/lib/errors";
import { localePath } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n-server";
import { publicResources } from "@/lib/public-resources";
import { title } from "@/lib/shared";
import type { Entity } from "@/lib/types";
import { PublicUnavailable } from "./public-unavailable";

async function options(resource: string) {
  const items: Entity[] = [];
  let unavailable = false;
  try {
    const first = await serverApi<Entity[]>(
      "/api/v1/" + resource + "?per_page=50",
    );
    items.push(...first.data);
    const lastPage = Math.min(first.pagination?.last_page || 1, 20);
    const truncated = (first.pagination?.last_page || 1) > lastPage;
    for (let page = 2; page <= lastPage; page += 4) {
      const next = await Promise.allSettled(
        Array.from({ length: Math.min(4, lastPage - page + 1) }, (_, index) =>
          serverApi<Entity[]>(
            "/api/v1/" + resource + "?per_page=50&page=" + (page + index),
          ),
        ),
      );
      for (const result of next) {
        if (result.status === "fulfilled") items.push(...result.value.data);
        else if (
          publicApiUnavailable(result.reason) ||
          (result.reason instanceof ApiError && result.reason.status === 404)
        )
          unavailable = true;
        else throw result.reason;
      }
      if (unavailable) break;
    }
    unavailable ||= truncated;
  } catch (error) {
    if (
      !publicApiUnavailable(error) &&
      !(error instanceof ApiError && error.status === 404)
    )
      throw error;
    unavailable = true;
  }
  return { items, unavailable };
}
export async function PublicFilters({
  resource,
  query,
}: {
  resource: string;
  query: URLSearchParams;
}) {
  const { locale, t } = await getTranslations();
  const config = publicResources[resource];
  const expert = resource === "experts";
  const board = resource === "board-members";
  const [groups, disciplines, terms] = await Promise.all([
    expert ? options("expert-groups") : { items: [], unavailable: false },
    expert || resource === "qualifications"
      ? options("disciplines")
      : { items: [], unavailable: false },
    board ? options("board-terms") : { items: [], unavailable: false },
  ]);
  return (
    <>
      {(groups.unavailable || disciplines.unavailable || terms.unavailable) && (
        <PublicUnavailable compact />
      )}
      <form className="filter-bar" action={localePath("/" + resource, locale)}>
        <label>
          {t("جستجو")}
          <input
            name="q"
            defaultValue={query.get("q") || ""}
            placeholder={t("عنوان یا نام…")}
            maxLength={150}
          />
        </label>
        {config.types && (
          <label>
            {t("نوع")}
            <select name="type" defaultValue={query.get("type") || ""}>
              <option value="">{t("همه")}</option>
              {Object.entries(config.types).map(([key, value]) => (
                <option key={key} value={key}>
                  {t(value)}
                </option>
              ))}
            </select>
          </label>
        )}
        {expert && (
          <>
            {[
              ["first_name", "نام"],
              ["last_name", "نام خانوادگی"],
              ["license_number", "شماره پروانه"],
              ["city", "شهر"],
              ["geographical_scope", "حوزه جغرافیایی"],
            ].map(([key, label]) => (
              <label key={key}>
                {t(label)}
                <input
                  name={key}
                  defaultValue={query.get(key) || ""}
                  maxLength={100}
                />
              </label>
            ))}
            <label>
              {t("گروه")}
              <select
                name="expert_group_id"
                defaultValue={query.get("expert_group_id") || ""}
              >
                <option value="">{t("همه گروه‌ها")}</option>
                {groups.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {title(item)}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {disciplines.items.length > 0 && (
          <label>
            {t("رشته")}
            <select
              name="discipline_id"
              defaultValue={query.get("discipline_id") || ""}
            >
              <option value="">{t("همه رشته‌ها")}</option>
              {disciplines.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {title(item)}
                </option>
              ))}
            </select>
          </label>
        )}
        {board && (
          <>
            <label>
              {t("دوره")}
              <select
                name="board_term_id"
                defaultValue={query.get("board_term_id") || ""}
              >
                <option value="">{t("همه دوره‌ها")}</option>
                {terms.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {title(item)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("ارکان")}
              <select name="role" defaultValue={query.get("role") || ""}>
                <option value="">{t("همه")}</option>
                <option value="board">{t("هیئت مدیره")}</option>
                <option value="inspector">{t("بازرسان")}</option>
                <option value="prosecutor">{t("دادستان انتظامی")}</option>
                <option value="former_president">{t("رؤسای پیشین")}</option>
              </select>
            </label>
          </>
        )}
        {["news", "articles"].includes(resource) && (
          <>
            <label>
              {t("از تاریخ")}
              <input
                type="date"
                name="from"
                defaultValue={query.get("from") || ""}
              />
            </label>
            <label>
              {t("تا تاریخ")}
              <input
                type="date"
                name="to"
                defaultValue={query.get("to") || ""}
              />
            </label>
          </>
        )}
        <label>
          {t("ترتیب")}
          <select name="sort" defaultValue={query.get("sort") || "latest"}>
            <option value="latest">{t("جدیدترین")}</option>
            <option value="oldest">{t("قدیمی‌ترین")}</option>
            <option value="title">{t("عنوان")}</option>
          </select>
        </label>
        <button className="primary-button">{t("اعمال فیلتر")}</button>
        <Link prefetch={false} className="clear-link" href={"/" + resource}>
          {t("پاک کردن")}
        </Link>
      </form>
    </>
  );
}
