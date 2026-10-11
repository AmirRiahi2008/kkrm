"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";
import { useLocale } from "./locale-provider";

export function PublicUnavailable({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { locale, t } = useLocale();

  return (
    <section
      className={
        compact
          ? "public-unavailable compact"
          : "detail-panel public-unavailable"
      }
      role="alert"
      aria-busy={pending}
    >
      <AlertCircle size={compact ? 18 : 28} aria-hidden="true" />
      <div>
        {!compact && <h2>{t("دریافت اطلاعات انجام نشد")}</h2>}
        <p>
          {locale === "en"
            ? "This section is temporarily unavailable. Please try again shortly."
            : "اطلاعات این بخش موقتاً در دسترس نیست. کمی بعد دوباره تلاش کنید."}
        </p>
      </div>
      <button
        type="button"
        className="primary-button"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        {pending ? (
          <LoaderCircle size={17} className="spin" />
        ) : (
          <RefreshCw size={17} />
        )}
        {t("تلاش دوباره")}
      </button>
    </section>
  );
}
