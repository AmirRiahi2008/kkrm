import Link from "next/link";
import { serverApi } from "@/lib/api-server";
import { title } from "@/lib/shared";
import { publicResources } from "@/lib/public-resources";
import type { Entity } from "@/lib/types";

async function options(resource: string) {
  const first = await serverApi<Entity[]>(
    "/api/v1/" + resource + "?per_page=50",
  );
  const next = await Promise.all(
    Array.from(
      {
        length: Math.max(0, Math.min(first.pagination?.last_page || 1, 20) - 1),
      },
      (_, i) =>
        serverApi<Entity[]>(
          "/api/v1/" + resource + "?per_page=50&page=" + (i + 2),
        ),
    ),
  );
  return [...first.data, ...next.flatMap((page) => page.data)];
}
export async function PublicFilters({
  resource,
  query,
}: {
  resource: string;
  query: URLSearchParams;
}) {
  const config = publicResources[resource];
  const expert = resource === "experts";
  const board = resource === "board-members";
  const [groups, disciplines, terms] = await Promise.all([
    expert ? options("expert-groups") : [],
    expert || resource === "qualifications" ? options("disciplines") : [],
    board ? options("board-terms") : [],
  ]);
  return (
    <form className="filter-bar" action={"/" + resource}>
      <label>
        جستجو
        <input
          name="q"
          defaultValue={query.get("q") || ""}
          placeholder="عنوان یا نام…"
          maxLength={150}
        />
      </label>
      {config.types && (
        <label>
          نوع
          <select name="type" defaultValue={query.get("type") || ""}>
            <option value="">همه</option>
            {Object.entries(config.types).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
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
              {label}
              <input
                name={key}
                defaultValue={query.get(key) || ""}
                maxLength={100}
              />
            </label>
          ))}
          <label>
            گروه
            <select
              name="expert_group_id"
              defaultValue={query.get("expert_group_id") || ""}
            >
              <option value="">همه گروه‌ها</option>
              {groups.map((item) => (
                <option key={item.id} value={item.id}>
                  {title(item)}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      {disciplines.length > 0 && (
        <label>
          رشته
          <select
            name="discipline_id"
            defaultValue={query.get("discipline_id") || ""}
          >
            <option value="">همه رشته‌ها</option>
            {disciplines.map((item) => (
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
            دوره
            <select
              name="board_term_id"
              defaultValue={query.get("board_term_id") || ""}
            >
              <option value="">همه دوره‌ها</option>
              {terms.map((item) => (
                <option key={item.id} value={item.id}>
                  {title(item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            ارکان
            <select name="role" defaultValue={query.get("role") || ""}>
              <option value="">همه</option>
              <option value="board">هیئت مدیره</option>
              <option value="inspector">بازرسان</option>
              <option value="prosecutor">دادستان انتظامی</option>
              <option value="former_president">رؤسای پیشین</option>
            </select>
          </label>
        </>
      )}
      {["news", "articles"].includes(resource) && (
        <>
          <label>
            از تاریخ
            <input
              type="date"
              name="from"
              defaultValue={query.get("from") || ""}
            />
          </label>
          <label>
            تا تاریخ
            <input type="date" name="to" defaultValue={query.get("to") || ""} />
          </label>
        </>
      )}
      <label>
        ترتیب
        <select name="sort" defaultValue={query.get("sort") || "latest"}>
          <option value="latest">جدیدترین</option>
          <option value="oldest">قدیمی‌ترین</option>
          <option value="title">عنوان</option>
        </select>
      </label>
      <button className="primary-button">اعمال فیلتر</button>
      <Link prefetch={false} className="clear-link" href={"/" + resource}>
        پاک کردن
      </Link>
    </form>
  );
}
