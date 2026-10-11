"use client";

import {
  dismissToast,
  getServerToasts,
  getToasts,
  subscribeToasts,
} from "@/lib/toast-store";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useLocale } from "./locale-provider";

export function ToastProvider() {
  const items = useSyncExternalStore(
    subscribeToasts,
    getToasts,
    getServerToasts,
  );
  const { locale } = useLocale();
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {items.map((item) => (
        <div
          key={item.id}
          className={"app-toast toast-" + item.kind}
          role={item.kind === "error" ? "alert" : "status"}
        >
          {item.kind === "success" ? (
            <CheckCircle2 size={21} />
          ) : item.kind === "error" ? (
            <AlertCircle size={21} />
          ) : (
            <Info size={21} />
          )}
          <p>{item.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(item.id)}
            aria-label={locale === "en" ? "Dismiss notification" : "بستن اعلان"}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
