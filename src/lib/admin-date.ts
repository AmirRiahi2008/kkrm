import {
  GregorianCalendar,
  parseAbsolute,
  parseDate,
  toCalendar,
  toCalendarDate,
  toCalendarDateTime,
  toZoned,
} from "@internationalized/date";
import type { DateValue } from "@internationalized/date";
import type { Value } from "./types";

export const ADMIN_TIME_ZONE = "Asia/Tehran";
export const ADMIN_DATE_LOCALE = "fa-IR-u-ca-persian";

function isoDateTime(value: string): string {
  let iso = value.trim().replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) iso += "T00:00:00";
  if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(iso)) iso += "Z";
  return iso;
}

export function parseAdminDate(
  value: Value,
  withTime: boolean,
): DateValue | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return withTime
      ? parseAbsolute(isoDateTime(value), ADMIN_TIME_ZONE)
      : parseDate(value.trim().slice(0, 10));
  } catch {
    return null;
  }
}

export function adminDatePayload(
  value: DateValue | null,
  withTime: boolean,
): string {
  if (!value) return "";
  const gregorian = toCalendar(value, new GregorianCalendar());
  if (!withTime) return toCalendarDate(gregorian).toString();
  const zoned =
    "timeZone" in gregorian
      ? gregorian
      : toZoned(toCalendarDateTime(gregorian), ADMIN_TIME_ZONE, "reject");
  return zoned.toDate().toISOString();
}

export function normalizeAdminDate(value: Value, withTime: boolean): string {
  return adminDatePayload(parseAdminDate(value, withTime), withTime);
}

export function formatAdminDate(
  value: Value,
  {
    withTime = true,
    weekday = false,
  }: { withTime?: boolean; weekday?: boolean } = {},
): string {
  const dateOnly =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = parseAdminDate(value, !dateOnly);
  if (!parsed) return "—";
  const date =
    "timeZone" in parsed ? parsed.toDate() : parsed.toDate(ADMIN_TIME_ZONE);
  return new Intl.DateTimeFormat(ADMIN_DATE_LOCALE, {
    timeZone: ADMIN_TIME_ZONE,
    year: "numeric",
    month: weekday ? "long" : "2-digit",
    day: "2-digit",
    ...(weekday ? { weekday: "long" as const } : {}),
    ...(withTime && !dateOnly
      ? {
          hour: "2-digit" as const,
          minute: "2-digit" as const,
          hourCycle: "h23" as const,
        }
      : {}),
  }).format(date);
}

export function adminWeekday(value: Value): string {
  const parsed = parseAdminDate(value, false);
  if (!parsed) return "—";
  return new Intl.DateTimeFormat(ADMIN_DATE_LOCALE, {
    timeZone: ADMIN_TIME_ZONE,
    weekday: "short",
  }).format(parsed.toDate(ADMIN_TIME_ZONE));
}
