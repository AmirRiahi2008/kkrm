"use client";

import { useContext, useState } from "react";
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DatePicker,
  DatePickerStateContext,
  DateSegment,
  Dialog,
  FieldError,
  Group,
  Heading,
  I18nProvider,
  Label,
  Popover,
  Text,
} from "react-aria-components";
import {
  GregorianCalendar,
  today,
  toCalendar,
  toZoned,
} from "@internationalized/date";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  ADMIN_DATE_LOCALE,
  ADMIN_TIME_ZONE,
  adminDatePayload,
  parseAdminDate,
} from "@/lib/admin-date";
import "@/app/admin-jalali-date.css";

function CalendarActions({ withTime }: { withTime: boolean }) {
  const state = useContext(DatePickerStateContext);
  if (!state) return null;
  return (
    <div className="admin-jalali-calendar-actions">
      <Button
        onPress={() => {
          const currentDate = today(ADMIN_TIME_ZONE);
          const current = state.value
            ? toCalendar(state.value, new GregorianCalendar())
            : null;
          state.setValue(
            withTime
              ? current?.set({
                  year: currentDate.year,
                  month: currentDate.month,
                  day: currentDate.day,
                }) || toZoned(currentDate, ADMIN_TIME_ZONE)
              : currentDate,
          );
          state.setOpen(false);
        }}
      >
        امروز
      </Button>
      <Button onPress={() => state.setOpen(false)}>بستن تقویم</Button>
    </div>
  );
}

export function JalaliDateField({
  id,
  label,
  value,
  onChange,
  withTime = false,
  required = false,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  withTime?: boolean;
  required?: boolean;
  disabled?: boolean;
}) {
  const [conversionError, setConversionError] = useState("");
  const parsed = parseAdminDate(value, withTime);

  return (
    <I18nProvider locale={ADMIN_DATE_LOCALE}>
      <DatePicker
        id={id}
        data-date-field={id}
        className="admin-jalali-field"
        value={parsed}
        onChange={(date) => {
          try {
            onChange(adminDatePayload(date, withTime));
            setConversionError("");
          } catch {
            setConversionError(
              "ساعت انتخاب‌شده در این تاریخ معتبر نیست. ساعت دیگری انتخاب کنید.",
            );
          }
        }}
        isRequired={required}
        isDisabled={disabled}
        isInvalid={conversionError ? true : undefined}
        validationBehavior="native"
        granularity={withTime ? "minute" : "day"}
        placeholderValue={
          withTime
            ? toZoned(today(ADMIN_TIME_ZONE), ADMIN_TIME_ZONE)
            : today(ADMIN_TIME_ZONE)
        }
        hourCycle={24}
        hideTimeZone
        shouldForceLeadingZeros
        firstDayOfWeek="sat"
      >
        <Label>
          {label}
          {required && <span className="required-mark"> *</span>}
        </Label>
        <Group className="admin-jalali-input-group">
          <DateInput className="admin-jalali-segments">
            {(segment) => (
              <DateSegment className="admin-jalali-segment" segment={segment} />
            )}
          </DateInput>
          <Button
            className="admin-jalali-calendar-trigger"
            aria-label={`باز کردن تقویم شمسی ${label}`}
          >
            <CalendarDays size={19} />
          </Button>
          <Button
            slot={null}
            className="admin-jalali-clear"
            aria-label={`پاک کردن ${label}`}
            isDisabled={disabled || !value}
            onPress={() => {
              onChange("");
              setConversionError("");
            }}
          >
            <X size={16} />
          </Button>
        </Group>
        <Text slot="description" className="field-hint">
          {withTime ? "تاریخ شمسی · ساعت تهران (۲۴ ساعته)" : "تاریخ شمسی"}
        </Text>
        <FieldError className="field-error">
          {({ validationDetails }) =>
            conversionError ||
            (validationDetails.valueMissing
              ? "این تاریخ الزامی است."
              : "تاریخ و ساعت را کامل و معتبر وارد کنید.")
          }
        </FieldError>
        <Popover
          className="admin-jalali-popover"
          placement="bottom start"
          offset={8}
        >
          <Dialog
            className="admin-jalali-calendar-dialog"
            aria-label={`تقویم شمسی ${label}`}
          >
            <Calendar className="admin-jalali-calendar" firstDayOfWeek="sat">
              <div className="admin-jalali-calendar-heading">
                <Button slot="previous" aria-label="ماه قبل">
                  <ChevronRight size={20} />
                </Button>
                <Heading />
                <Button slot="next" aria-label="ماه بعد">
                  <ChevronLeft size={20} />
                </Button>
              </div>
              <CalendarGrid
                className="admin-jalali-calendar-grid"
                weekdayStyle="narrow"
              >
                <CalendarGridHeader>
                  {(day) => (
                    <CalendarHeaderCell
                      aria-label={
                        (
                          {
                            ش: "شنبه",
                            ی: "یکشنبه",
                            د: "دوشنبه",
                            س: "سه‌شنبه",
                            چ: "چهارشنبه",
                            پ: "پنجشنبه",
                            ج: "جمعه",
                          } as Record<string, string>
                        )[day] || day
                      }
                    >
                      {day}
                    </CalendarHeaderCell>
                  )}
                </CalendarGridHeader>
                <CalendarGridBody>
                  {(date) => (
                    <CalendarCell
                      className="admin-jalali-calendar-cell"
                      date={date}
                    />
                  )}
                </CalendarGridBody>
              </CalendarGrid>
            </Calendar>
            <CalendarActions withTime={withTime} />
            <p className="admin-jalali-calendar-tip">
              سال، ماه و روز را می‌توانید مستقیم در ورودی تایپ کنید.
            </p>
          </Dialog>
        </Popover>
      </DatePicker>
    </I18nProvider>
  );
}
