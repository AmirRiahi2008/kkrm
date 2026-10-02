"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  getLoadingCount,
  getServerLoadingCount,
  subscribeLoading,
} from "@/lib/loading-store";

export function GlobalLoader() {
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
      aria-label="در حال انجام عملیات"
    >
      <div className="global-loading-card">
        <span className="global-loading-spinner" aria-hidden="true" />
        <strong>در حال انجام عملیات…</strong>
        <span>لطفاً کمی صبر کنید.</span>
      </div>
    </div>,
    document.body,
  );
}

export function RouteLoading() {
  return (
    <div
      className="global-route-placeholder"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="global-loading-spinner" aria-hidden="true" />
      <span>در حال دریافت اطلاعات…</span>
    </div>
  );
}
