"use client";

import { localePath } from "@/lib/i18n";
import { Check, ChevronDown } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useRef } from "react";
import { useLocale } from "./locale-provider";

function IranFlag() {
  return (
    <svg
      className="language-flag"
      viewBox="0 0 24 16"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="#fff" d="M0 0h24v16H0z" />
      <path fill="#239f40" d="M0 0h24v5.33H0z" />
      <path fill="#da0000" d="M0 10.67h24V16H0z" />
      <g fill="none" stroke="#da0000" strokeWidth=".65" strokeLinecap="round">
        <path d="M12 6v4M10.9 6.5c-1.1 1.5-.5 2.5 1.1 3.2M13.1 6.5c1.1 1.5.5 2.5-1.1 3.2M11.2 6.5c.5.1.6.3.8.5.2-.2.3-.4.8-.5" />
      </g>
    </svg>
  );
}

function SwitchLinks() {
  const path = usePathname();
  const query = useSearchParams();
  const { locale } = useLocale();
  const menu = useRef<HTMLDetailsElement>(null);
  const id = useId();
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        menu.current?.open &&
        !menu.current.contains(event.target)
      )
        menu.current.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);
  const suffix = query.size ? "?" + query.toString() : "";
  return (
    <div
      className="language-switch language-dropdown"
      aria-label={locale === "en" ? "Site language" : "زبان سایت"}
    >
      <a
        className="language-current"
        href={localePath(path, "fa") + suffix}
        lang="fa"
        dir="rtl"
        aria-current={locale === "fa" ? "page" : undefined}
      >
        <IranFlag />
        <span>فارسی</span>
      </a>
      <details
        ref={menu}
        className="language-menu"
        onPointerEnter={(event) => {
          if (
            event.pointerType === "mouse" &&
            window.matchMedia("(hover: hover)").matches
          )
            event.currentTarget.open = true;
        }}
        onPointerLeave={(event) => {
          if (
            event.pointerType === "mouse" &&
            !event.currentTarget.querySelector(":focus-visible")
          )
            event.currentTarget.open = false;
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            event.currentTarget.open = false;
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.currentTarget
              .querySelector<HTMLElement>(":scope > summary")
              ?.focus();
            event.currentTarget.open = false;
          }
        }}
      >
        <summary
          aria-label={locale === "en" ? "Choose a language" : "انتخاب زبان"}
          aria-controls={id + "-languages"}
          onClick={(event) => {
            const pointerType =
              "pointerType" in event.nativeEvent
                ? event.nativeEvent.pointerType
                : "";
            if (
              event.detail > 0 &&
              pointerType !== "touch" &&
              pointerType !== "pen" &&
              window.matchMedia("(hover: hover) and (pointer: fine)").matches
            ) {
              event.preventDefault();
              if (menu.current) menu.current.open = true;
            }
          }}
        >
          <ChevronDown size={14} aria-hidden="true" />
        </summary>
        <div className="language-options" id={id + "-languages"}>
          <a
            href={localePath(path, "en") + suffix}
            lang="en"
            dir="ltr"
            aria-current={locale === "en" ? "page" : undefined}
          >
            <span className="language-code" aria-hidden="true">
              EN
            </span>
            <span>English</span>
            {locale === "en" && <Check size={15} aria-hidden="true" />}
          </a>
        </div>
      </details>
    </div>
  );
}

export function LanguageSwitch() {
  return (
    <Suspense
      fallback={
        <span className="language-switch language-dropdown" dir="rtl">
          <span className="language-current">
            <IranFlag />
            <span>فارسی</span>
          </span>
          <span className="language-menu-placeholder">
            <ChevronDown size={14} aria-hidden="true" />
          </span>
        </span>
      }
    >
      <SwitchLinks />
    </Suspense>
  );
}
