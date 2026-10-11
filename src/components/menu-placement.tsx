"use client";

import {
  menuDestinations,
  menuParentChoices,
  menuPlacementPreview,
  selectedMenuDestination,
  type MenuDestination,
} from "@/lib/menu-placement";
import { text } from "@/lib/shared";
import type { Entity, Value } from "@/lib/types";
import {
  Check,
  Compass,
  LayoutGrid,
  Link2,
  ListTree,
  PanelBottom,
  Smartphone,
  Zap,
} from "lucide-react";
import "@/app/menu-placement.css";
import { useMemo } from "react";

const icons = {
  main: Compass,
  mega: LayoutGrid,
  both: Link2,
  footer: PanelBottom,
  mobile: Smartphone,
  quick: Zap,
};

export function MenuPlacement({
  values,
  items,
  currentId,
  disabled,
  errors,
  onChange,
}: {
  values: Record<string, Value>;
  items: Entity[];
  currentId?: number;
  disabled: boolean;
  errors: Record<string, string[]>;
  onChange: (update: Record<string, Value>) => void;
}) {
  const selected = selectedMenuDestination(values);
  const direct =
    selected === "main" || selected === "both" || selected === "footer";
  const hasChildren = items.some(
    (item) => Number(item.parent_id) === currentId,
  );
  const location = text(values.location);
  const parents = useMemo(
    () => menuParentChoices(items, location, currentId),
    [items, location, currentId],
  );
  const currentParent = Number(values.parent_id) || null;
  const parentAvailable =
    !currentParent || parents.some((item) => item.id === currentParent);
  function choose(key: MenuDestination) {
    const destination = menuDestinations.find((item) => item.key === key);
    if (!destination) return;
    const sameLocation = values.location === destination.location;
    onChange({
      location: destination.location,
      display_mode: destination.mode,
      parent_id:
        sameLocation && !["main", "both", "footer"].includes(key)
          ? values.parent_id || null
          : null,
    });
  }
  const messages = ["location", "display_mode", "parent_id"].flatMap(
    (key) => errors[key] || [],
  );
  return (
    <fieldset className="menu-placement" disabled={disabled}>
      <legend>این لینک کجای سایت نمایش داده شود؟</legend>
      <p className="menu-placement-intro">
        برای نمایش کنار لینک‌های بالای سایت، «ناوبری اصلی» را انتخاب کنید. نیازی
        به انتخاب لینک بالاتر ندارید.
      </p>
      <div className="menu-placement-options">
        {menuDestinations.map((destination) => {
          const Icon = icons[destination.key];
          const blocked =
            hasChildren &&
            (destination.location !== location || destination.key === "main");
          return (
            <label
              key={destination.key}
              className={
                "menu-placement-option" +
                (selected === destination.key ? " is-selected" : "") +
                (blocked ? " is-disabled" : "")
              }
            >
              <input
                type="radio"
                name="menu-destination"
                value={destination.key}
                checked={selected === destination.key}
                disabled={blocked}
                onChange={() => choose(destination.key)}
              />
              <Icon size={20} aria-hidden="true" />
              <span>
                <strong>{destination.label}</strong>
                <small>{destination.description}</small>
              </span>
              {selected === destination.key && (
                <Check size={18} aria-hidden="true" />
              )}
            </label>
          );
        })}
      </div>
      {hasChildren && (
        <p className="field-hint">
          {location === "header"
            ? "این لینک زیرمجموعه دارد. برای نمایش آن بالای سایت همراه با حفظ زیرمجموعه‌ها، «ناوبری اصلی و مگامنو» را انتخاب کنید."
            : "این لینک زیرمجموعه دارد. برای تغییر محل نمایش، ابتدا زیرمجموعه‌های آن را به محل جدید منتقل کنید."}
        </p>
      )}
      {!direct && (
        <div className="menu-placement-parent">
          <label htmlFor="menu-parent">
            <ListTree size={18} aria-hidden="true" /> زیر یک لینک دیگر قرار
            بگیرد؟ <span>اختیاری</span>
          </label>
          <select
            id="menu-parent"
            value={currentParent || ""}
            aria-invalid={!parentAvailable || !!errors.parent_id?.length}
            aria-describedby="menu-parent-hint"
            onChange={(event) =>
              onChange({ parent_id: Number(event.target.value) || null })
            }
          >
            <option value="">
              {selected === "mega"
                ? "لینک مستقل داخل مگامنو"
                : "لینک مستقل در این محل"}
            </option>
            {!parentAvailable && (
              <option value={currentParent!} disabled>
                لینک قبلی دیگر قابل انتخاب نیست؛ محل جدید را مشخص کنید
              </option>
            )}
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.label}
                {parent.inactive ? " (این بخش غیرفعال است)" : ""}
              </option>
            ))}
          </select>
          <p id="menu-parent-hint" className="field-hint">
            اگر لینک مستقل می‌خواهید، گزینه اول را نگه دارید. برای زیرمنو، نام
            بخش بالاتر را انتخاب کنید؛ مثلاً قوانین و مقررات ← نظام‌نامه‌ها.
          </p>
        </div>
      )}
      <div className="menu-placement-preview" role="status" aria-live="polite">
        <span>مسیر نمایش لینک</span>
        <strong>{menuPlacementPreview(values, items)}</strong>
      </div>
      {messages.map((message, index) => (
        <p className="field-error" key={index}>
          {message}
        </p>
      ))}
    </fieldset>
  );
}
