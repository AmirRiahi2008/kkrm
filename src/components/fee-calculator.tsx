"use client";

import { api } from "@/lib/api-client";
import { ApiError, errorMessage } from "@/lib/errors";
import { localDate, number } from "@/lib/i18n";
import type { FeeCalculation, TariffVersion } from "@/lib/portal-types";
import { safeHref } from "@/lib/shared";
import {
  Calculator,
  ClipboardCopy,
  ExternalLink,
  LoaderCircle,
  RotateCcw,
  WalletCards,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { JalaliDateField } from "./jalali-date-field";
import { useLocale } from "./locale-provider";
import Link from "./localized-link";

function digits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[,،٬\s]/g, "");
}

export function FeeCalculator({
  tariffs,
  today,
}: {
  tariffs: TariffVersion[];
  today: string;
}) {
  const { locale, t } = useLocale();
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("IRR");
  const [count, setCount] = useState("1");
  const [date, setDate] = useState(today);
  const [tariffId, setTariffId] = useState("");
  const [result, setResult] = useState<FeeCalculation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const output = useRef<HTMLDivElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const eligible = tariffs.filter(
    (item) =>
      item.effective_from.slice(0, 10) <= date &&
      (!item.effective_to || item.effective_to.slice(0, 10) >= date),
  );
  function clearResult() {
    setResult(null);
    setError("");
    setCopied(false);
  }
  async function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    clearResult();
    const normalized = digits(amount);
    if (!/^\d+$/.test(normalized) || normalized.length > 16) {
      setError(
        locale === "en"
          ? "Enter a valid positive amount."
          : "مبلغ را به صورت عدد صحیح و مثبت وارد کنید.",
      );
      return;
    }
    const rial = BigInt(normalized) * (unit === "toman" ? 10n : 1n);
    if (rial < 1n || rial > 1000000000000000n) {
      setError(
        locale === "en"
          ? "The rial amount is outside the supported range."
          : "مبلغ ریالی باید بین ۱ و ۱٬۰۰۰٬۰۰۰٬۰۰۰٬۰۰۰٬۰۰۰ باشد.",
      );
      return;
    }
    if (!date || date > today) {
      setError(
        locale === "en"
          ? "Select a date on or before today."
          : "تاریخ محاسبه باید امروز یا قبل از آن باشد.",
      );
      return;
    }
    if (!eligible.length) {
      setError(
        locale === "en"
          ? "No active tariff is available for this date."
          : "برای این تاریخ، نسخه فعال تعرفه ثبت نشده است.",
      );
      return;
    }
    lock.current = true;
    setBusy(true);
    controller.current = new AbortController();
    try {
      const { data } = await api<FeeCalculation>("/api/v1/tariffs/calculate", {
        method: "POST",
        signal: controller.current.signal,
        body: JSON.stringify({
          value: Number(rial),
          expert_count: Number(count),
          date,
          ...(tariffId && eligible.some((item) => String(item.id) === tariffId)
            ? { tariff_id: Number(tariffId) }
            : {}),
        }),
      });
      if (controller.current.signal.aborted) return;
      setResult(data);
      setTimeout(
        () =>
          output.current?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth",
            block: "nearest",
          }),
        0,
      );
    } catch (reason) {
      if (!controller.current.signal.aborted)
        setError(
          reason instanceof ApiError && Object.values(reason.errors).length
            ? Object.values(reason.errors).flat().join(" ")
            : errorMessage(reason),
        );
    } finally {
      lock.current = false;
      if (!controller.current?.signal.aborted) setBusy(false);
    }
  }
  async function copyResult() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(
        `${result.tariff_name}\n${result.total} IRR`,
      );
      setCopied(true);
    } catch {
      setError(
        locale === "en" ? "Could not copy the result." : "کپی نتیجه انجام نشد.",
      );
    }
  }
  const precise = (value: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-GB" : "fa-IR", {
      maximumFractionDigits: 5,
    }).format(value);
  const current = result
    ? tariffs.find((item) => item.id === result.tariff_id)
    : null;
  const source = safeHref(current?.source_url);
  const money = (value: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-GB" : "fa-IR", {
      maximumFractionDigits: 1,
    }).format(value);
  return (
    <div className="fee-calculator-layout">
      <form
        className="fee-calculator-form"
        onSubmit={calculate}
        aria-busy={busy}
      >
        <div className="fee-heading">
          <span>
            <Calculator size={25} />
          </span>
          <div>
            <h2>
              {locale === "en"
                ? "Estimate the expert fee"
                : "برآورد دستمزد کارشناسی"}
            </h2>
            <p>
              {locale === "en"
                ? "Using the tariff version recorded by the council"
                : "بر اساس نسخه تعرفه ثبت‌شده توسط کانون"}
            </p>
          </div>
        </div>
        <fieldset disabled={busy}>
          <div className="fee-form-grid">
            <label className="fee-amount">
              {locale === "en" ? "Appraised value" : "ارزش موضوع ارزیابی"}
              <input
                name="value"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  clearResult();
                }}
                dir="ltr"
                inputMode="numeric"
                maxLength={25}
                required
                placeholder={
                  locale === "en" ? "e.g. 1,000,000,000" : "مثلاً ۱٬۰۰۰٬۰۰۰٬۰۰۰"
                }
              />
              <small>
                {amount && /^\d{1,16}$/.test(digits(amount))
                  ? money(Number(digits(amount)))
                  : "—"}{" "}
                {unit === "IRR"
                  ? t("ریال")
                  : locale === "en"
                    ? "tomans"
                    : "تومان"}
              </small>
            </label>
            <label>
              {locale === "en" ? "Input currency" : "واحد مبلغ ورودی"}
              <select
                value={unit}
                onChange={(event) => {
                  setUnit(event.target.value);
                  clearResult();
                }}
              >
                <option value="IRR">{t("ریال")}</option>
                <option value="toman">
                  {locale === "en" ? "Toman (10 rials)" : "تومان (۱۰ ریال)"}
                </option>
              </select>
            </label>
            <label>
              {locale === "en" ? "Number of experts" : "تعداد کارشناسان"}
              <select
                value={count}
                onChange={(event) => {
                  setCount(event.target.value);
                  clearResult();
                }}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {number(value, locale)}{" "}
                    {locale === "en" ? "expert(s)" : "نفر"}
                  </option>
                ))}
              </select>
            </label>
            <JalaliDateField
              id="fee-calculation-date"
              label={
                locale === "en"
                  ? "Calculation date (Persian calendar)"
                  : "تاریخ محاسبه"
              }
              value={date}
              disabled={busy}
              required
              onChange={(value) => {
                setDate(value);
                setTariffId("");
                clearResult();
              }}
            />
            <label className="fee-version">
              {locale === "en" ? "Tariff version" : "نسخه تعرفه"}
              <select
                value={tariffId}
                onChange={(event) => {
                  setTariffId(event.target.value);
                  clearResult();
                }}
              >
                <option value="">
                  {locale === "en"
                    ? "Latest effective version"
                    : "آخرین نسخه معتبر در تاریخ انتخاب‌شده"}
                </option>
                {eligible.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>
        {!tariffs.length && (
          <p className="fee-empty" role="status">
            {locale === "en"
              ? "The council has not configured an active tariff yet."
              : "هنوز تعرفه فعالی توسط کانون ثبت نشده است."}
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {t(error)}
          </p>
        )}
        <div className="fee-form-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={busy || !tariffs.length}
          >
            {busy ? (
              <LoaderCircle className="portal-spin" size={18} />
            ) : (
              <Calculator size={18} />
            )}
            {busy
              ? t("در حال انجام…")
              : locale === "en"
                ? "Calculate fee"
                : "محاسبه دستمزد"}
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={busy}
            onClick={() => {
              setAmount("");
              setUnit("IRR");
              setCount("1");
              setDate(today);
              setTariffId("");
              clearResult();
            }}
          >
            <RotateCcw size={16} />
            {t("پاک کردن")}
          </button>
        </div>
      </form>
      <aside className="fee-guide">
        <WalletCards size={28} />
        <h2>{locale === "en" ? "Before you calculate" : "راهنمای محاسبه"}</h2>
        <p>
          {locale === "en"
            ? "Enter the full appraised value and choose the currency. Results use rials; each toman equals 10 rials."
            : "ارزش کامل موضوع ارزیابی را وارد کنید و واحد مبلغ را مشخص کنید. نتیجه بر حسب ریال محاسبه می‌شود؛ هر تومان برابر ۱۰ ریال است."}
        </p>
        <p>
          {locale === "en"
            ? "The council manages rates, limits and panel factors. This calculator estimates the configured valuation fee; other services and case-specific costs need separate assessment."
            : "نرخ پله‌ها، حداقل و سقف دستمزد و ضریب هیئت از تعرفه ثبت‌شده کانون خوانده می‌شوند. این صفحه برآورد تعرفه ارزیابی است؛ خدمات دیگر و هزینه‌های خاص پرونده باید جداگانه بررسی شوند."}
        </p>
        <Link href="/documents?type=tariff" prefetch={false}>
          {locale === "en" ? "Read fee documents" : "مطالعه اسناد تعرفه"}
          <ExternalLink size={15} />
        </Link>
      </aside>
      {result && (
        <div
          ref={output}
          className="fee-result"
          role="status"
          aria-live="polite"
        >
          <div className="fee-result-heading">
            <div>
              <span>
                {locale === "en" ? "Estimated fee" : "دستمزد برآوردشده"}
              </span>
              <h2>
                {money(result.total)} <small>{t("ریال")}</small>
              </h2>
              <p>
                {money(result.total / 10)}{" "}
                {locale === "en" ? "tomans" : "تومان"}
              </p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void copyResult()}
            >
              <ClipboardCopy size={16} />
              {copied
                ? locale === "en"
                  ? "Copied"
                  : "کپی شد"
                : locale === "en"
                  ? "Copy result"
                  : "کپی نتیجه"}
            </button>
          </div>
          <dl className="fee-result-meta">
            <div>
              <dt>{locale === "en" ? "Tariff version" : "نسخه تعرفه"}</dt>
              <dd>{result.tariff_name}</dd>
            </div>
            <div>
              <dt>{locale === "en" ? "Calculation date" : "تاریخ محاسبه"}</dt>
              <dd>{localDate(date, locale)}</dd>
            </div>
            <div>
              <dt>
                {locale === "en" ? "Number of experts" : "تعداد کارشناسان"}
              </dt>
              <dd>{number(result.expert_count, locale)}</dd>
            </div>
            {current?.approval_reference && (
              <div>
                <dt>
                  {locale === "en" ? "Approval reference" : "شماره ابلاغ"}
                </dt>
                <dd>{current.approval_reference}</dd>
              </div>
            )}
          </dl>
          <details className="fee-breakdown">
            <summary>
              {locale === "en"
                ? "Calculation breakdown"
                : "جزئیات محاسبه پله‌ها"}
            </summary>
            <div className="fee-table-scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      locale === "en"
                        ? "Value in tier (rials)"
                        : "مبلغ این پله (ریال)",
                      locale === "en" ? "Rate (%)" : "نرخ (درصد)",
                      locale === "en" ? "Fee (rials)" : "دستمزد (ریال)",
                    ].map((label) => (
                      <th key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.segments.map((segment, index) => (
                    <tr key={index}>
                      <td>{money(segment.value)}</td>
                      <td>{precise(Number(segment.rate_bps) / 100)}</td>
                      <td>{money(segment.fee)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2}>
                      {locale === "en" ? "Base fee" : "مبلغ پایه"}
                    </td>
                    <td>{money(result.base_fee)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              {locale === "en" ? "Panel factor" : "ضریب هیئت"}:{" "}
              {precise(result.panel_multiplier_bps / 10000)}
            </p>
          </details>
          <p className="fee-notice">
            {result.is_demo
              ? locale === "en"
                ? "Demonstration calculation; not an approved tariff."
                : "این محاسبه آزمایشی است و تعرفه تأییدشده نیست."
              : t(result.notice)}
          </p>
          {source && (
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              {locale === "en" ? "View tariff source" : "مشاهده منبع تعرفه"}
              <ExternalLink size={15} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
