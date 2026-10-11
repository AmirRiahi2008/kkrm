"use client";

import { api } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import { localePath } from "@/lib/i18n";
import type { ExpertDirectoryFilters } from "@/lib/portal-types";
import { title } from "@/lib/shared";
import { LoaderCircle, RotateCcw, SearchCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useLocale } from "./locale-provider";

export function ExpertSearchForm({
  initialFilters,
  initialQuery,
}: {
  initialFilters: ExpertDirectoryFilters;
  initialQuery: string;
}) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const params = new URLSearchParams(initialQuery);
  const [group, setGroup] = useState(params.get("expert_group_id") || "");
  const [discipline, setDiscipline] = useState(
    params.get("discipline_id") || "",
  );
  const [qualification, setQualification] = useState(
    params.get("qualification_id") || "",
  );
  const [filters, setFilters] = useState(initialFilters);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [attempt, setAttempt] = useState(0);
  const loaded = useRef(group + ":" + discipline + ":0");
  useEffect(() => {
    const key = group + ":" + discipline + ":" + attempt;
    if (loaded.current === key) return;
    loaded.current = key;
    const controller = new AbortController();
    const query = new URLSearchParams();
    if (group) query.set("expert_group_id", group);
    if (discipline) query.set("discipline_id", discipline);
    void api<ExpertDirectoryFilters>("/api/v1/experts/filters?" + query, {
      signal: controller.signal,
    })
      .then(({ data }) => {
        if (!controller.signal.aborted) setFilters(data);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [group, discipline, attempt]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || error) return;
    const query = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string" && value.trim())
        query.set(key, value.trim());
    }
    query.set("search", "1");
    startTransition(() => router.push(localePath("/experts?" + query, locale)));
  }
  function clear() {
    for (const input of form.current?.querySelectorAll<HTMLInputElement>(
      "input[name]",
    ) ?? [])
      input.value = "";
    const status = form.current?.querySelector<HTMLSelectElement>(
      'select[name="status"]',
    );
    if (status) status.value = "";
    setGroup("");
    setDiscipline("");
    setQualification("");
    setError("");
    if (group || discipline || error) {
      setLoading(true);
      setAttempt((value) => value + 1);
    }
    startTransition(() => router.push(localePath("/experts", locale)));
  }
  return (
    <form
      ref={form}
      className="expert-search-panel"
      onSubmit={submit}
      aria-busy={pending || loading}
    >
      <div className="expert-search-heading">
        <span>
          <SearchCheck size={24} />
        </span>
        <div>
          <h2>
            {locale === "en"
              ? "Find your official expert"
              : "کارشناس مورد نظر خود را پیدا کنید"}
          </h2>
          <p>
            {locale === "en"
              ? "Combine fields to narrow down your search."
              : "می‌توانید چند فیلتر را هم‌زمان انتخاب کنید."}
          </p>
        </div>
      </div>
      <div className="expert-search-fields">
        {[
          ["first_name", "نام"],
          ["last_name", "نام خانوادگی"],
          ["license_number", "شماره پروانه"],
          ["geographical_scope", "حوزه جغرافیایی"],
        ].map(([key, label]) => (
          <label key={key}>
            {t(label)}
            <input
              name={key}
              defaultValue={params.get(key) || ""}
              maxLength={100}
              autoComplete="off"
            />
          </label>
        ))}
        <label>
          {t("شهر")}
          <input
            name="city"
            list="expert-cities"
            defaultValue={params.get("city") || ""}
            maxLength={100}
          />
          <datalist id="expert-cities">
            {filters.cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </label>
        <label>
          {t("گروه")}
          <select
            name="expert_group_id"
            value={group}
            onChange={(event) => {
              setGroup(event.target.value);
              setDiscipline("");
              setQualification("");
              setError("");
              setLoading(true);
            }}
          >
            <option value="">{t("همه گروه‌ها")}</option>
            {filters.groups.map((item) => (
              <option key={item.id} value={item.id}>
                {title(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("رشته")}
          <select
            name="discipline_id"
            value={discipline}
            disabled={loading}
            onChange={(event) => {
              setDiscipline(event.target.value);
              setQualification("");
              setError("");
              setLoading(true);
            }}
          >
            <option value="">{t("همه رشته‌ها")}</option>
            {filters.disciplines.map((item) => (
              <option key={item.id} value={item.id}>
                {title(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {locale === "en" ? "Qualification" : "صلاحیت"}
          <select
            name="qualification_id"
            value={qualification}
            disabled={loading || !discipline}
            onChange={(event) => setQualification(event.target.value)}
          >
            <option value="">
              {!discipline
                ? locale === "en"
                  ? "Select a discipline first"
                  : "ابتدا رشته را انتخاب کنید"
                : locale === "en"
                  ? "All qualifications"
                  : "همه صلاحیت‌ها"}
            </option>
            {filters.qualifications.map((item) => (
              <option key={item.id} value={item.id}>
                {title(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {locale === "en" ? "License status" : "وضعیت پروانه"}
          <select name="status" defaultValue={params.get("status") || ""}>
            <option value="">{t("همه")}</option>
            <option value="active">
              {locale === "en" ? "Active" : "فعال"}
            </option>
            <option value="suspended">
              {locale === "en" ? "Suspended" : "تعلیق‌شده"}
            </option>
          </select>
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {t(error)}{" "}
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setError("");
              setLoading(true);
              setAttempt((value) => value + 1);
            }}
          >
            {t("تلاش دوباره")}
          </button>
        </p>
      )}
      <div className="expert-search-actions">
        <button
          className="primary-button"
          type="submit"
          disabled={pending || loading || !!error}
        >
          {pending || loading ? (
            <LoaderCircle size={18} className="portal-spin" />
          ) : (
            <SearchCheck size={18} />
          )}
          {locale === "en" ? "Search experts" : "جستجوی کارشناسان"}
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={pending}
          onClick={clear}
        >
          <RotateCcw size={16} />
          {t("پاک کردن")}
        </button>
      </div>
    </form>
  );
}
