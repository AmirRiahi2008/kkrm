"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { useLocale } from "./locale-provider";

function subscribe(callback: () => void) {
  window.addEventListener("theme-change", callback);
  return () => window.removeEventListener("theme-change", callback);
}
export function ThemeToggle({
  variant = "default",
}: {
  variant?: "default" | "icon";
}) {
  const { t } = useLocale();
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme === "dark",
    () => false,
  );
  useEffect(() => {
    let saved = "light";
    try {
      saved = localStorage.getItem("kkrm-theme") || "light";
    } catch {}
    document.documentElement.dataset.theme =
      saved === "dark" ? "dark" : "light";
    window.dispatchEvent(new Event("theme-change"));
  }, []);
  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("kkrm-theme", next);
    } catch {}
    window.dispatchEvent(new Event("theme-change"));
  }
  if (variant === "icon") {
    const label = t(dark ? "حالت روشن" : "حالت تاریک");
    return (
      <button
        type="button"
        className="public-theme-switch"
        aria-label={label}
        title={label}
        aria-pressed={dark}
        onClick={toggle}
      >
        <span className="theme-switch-sky" aria-hidden="true">
          <span className="theme-switch-cloud" />
          <span className="theme-switch-stars" />
        </span>
        <span className="theme-switch-thumb" aria-hidden="true">
          <Sun className="theme-switch-sun" size={20} strokeWidth={2} />
          <Moon className="theme-switch-moon" size={19} strokeWidth={2} />
        </span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className="utility-theme"
      aria-label={t(dark ? "حالت روشن" : "حالت تاریک")}
      aria-pressed={dark}
      onClick={toggle}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
      <span>{t(dark ? "حالت روشن" : "حالت تاریک")}</span>
    </button>
  );
}
