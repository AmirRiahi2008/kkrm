"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocale } from "./locale-provider";
import { createPortal } from "react-dom";
import {
  getLoadingCount,
  getServerLoadingCount,
  subscribeLoading,
} from "@/lib/loading-store";

export function GlobalLoader() {
  const { t } = useLocale();
  const count = useSyncExternalStore(
    subscribeLoading,
    getLoadingCount,
    getServerLoadingCount,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setVisible(count > 0),
      count > 0 ? 120 : 180,
    );
    return () => window.clearTimeout(timer);
  }, [count]);

  if (!visible || count === 0) return null;

  return createPortal(
    <div
      className="global-loading-overlay"
      role="status"
      aria-live="polite"
      aria-label={t("در حال انجام عملیات")}
    >
      <div className="global-loading-card">
        <span className="global-loading-spinner" aria-hidden="true" />
        <strong className="loading-council-name">
          {t("کانون کارشناسان رسمی دادگستری مازندران")}
        </strong>
        <span>{t("در حال انجام عملیات…")}</span>
        <span>{t("لطفاً کمی صبر کنید.")}</span>
      </div>
    </div>,
    document.body,
  );
}

export function RouteLoading() {
  const { t } = useLocale();
  return (
    <div
      className="global-route-placeholder"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="global-loading-spinner" aria-hidden="true" />
      <strong className="loading-council-name">
        {t("کانون کارشناسان رسمی دادگستری مازندران")}
      </strong>
      <span>{t("در حال دریافت اطلاعات…")}</span>
    </div>
  );
}
