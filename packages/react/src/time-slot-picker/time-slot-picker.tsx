"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Radio, RadioGroup } from "react-aria-components";
import { CalendarDate, getLocalTimeZone, parseDate, today as todayIn } from "@internationalized/date";
import { timeSlotPickerDefaults, type TimeSlotPickerSpecProps } from "../generated/time-slot-picker.types";
import { ActionButton } from "../action-button/action-button";
import { Button } from "../button/button";
import { Calendar } from "../calendar/calendar";
import { EmptyState } from "../empty-state/empty-state";
import { ErrorState } from "../error-state/error-state";
import { Skeleton } from "../skeleton/skeleton";
import { cx } from "../utils/cx";
import { ClockIcon } from "../utils/icons";
import { resolvePermission, type PermissionValue } from "../utils/permissions";

export interface TimeSlot {
  /** ISO time: 2026-10-12T09:30, or with an offset or Z. */
  time: string;
  available: boolean;
  /** Why a slot is taken, shown and read when it is not available. */
  reason?: string;
}

export interface TimeSlotPickerProps extends TimeSlotPickerSpecProps {
  className?: string;
}

const WALL = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/;

/** Formats a slot time. A time with no offset is wall time and is shown as written. */
function formatSlot(time: string, locale: string | undefined, timeZone: string | undefined) {
  const wall = WALL.exec(time);
  const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  if (wall) {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(new Date(Date.UTC(2000, 0, 1, +wall[4], +wall[5])));
  }
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return time;
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
  } catch {
    return new Intl.DateTimeFormat(locale, options).format(date);
  }
}

type Status = { kind: "loading" } | { kind: "error" } | { kind: "ready"; slots: TimeSlot[] };

/**
 * Pick a day with a calendar, then a time from the slots your getSlots returns for it. Taken times are disabled and
 * say why. The app owns which times exist. UI permission is not security: the server must check again.
 */
export function TimeSlotPicker({
  getSlots,
  onSelect,
  defaultDate,
  minDate,
  onDateChange,
  timeZone,
  locale,
  today: todayProp,
  label = timeSlotPickerDefaults.label,
  confirmLabel = timeSlotPickerDefaults.confirmLabel,
  permissions,
  classNames,
  className,
}: TimeSlotPickerProps) {
  const headingId = useId();
  const todayDate = useMemo(() => {
    if (todayProp) {
      try {
        return parseDate(todayProp);
      } catch {
        /* use the device date */
      }
    }
    return todayIn(timeZone ?? getLocalTimeZone());
  }, [todayProp, timeZone]);
  const min = useMemo(() => {
    try {
      return minDate ? parseDate(minDate) : todayDate;
    } catch {
      return todayDate;
    }
  }, [minDate, todayDate]);

  const [date, setDate] = useState<CalendarDate>(() => {
    let first = min;
    try {
      if (defaultDate) first = parseDate(defaultDate);
    } catch {
      /* keep the minimum */
    }
    return first.compare(min) < 0 ? min : first;
  });
  const [slot, setSlot] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const getSlotsRef = useRef(getSlots);
  getSlotsRef.current = getSlots;
  const key = date.toString();

  useEffect(() => {
    let current = true;
    setStatus({ kind: "loading" });
    setSlot(null);
    new Promise<TimeSlot[]>((resolve) => resolve(getSlotsRef.current(key)))
      .then((slots) => current && setStatus({ kind: "ready", slots }))
      .catch(() => current && setStatus({ kind: "error" }));
    return () => {
      current = false;
    };
  }, [key, attempt]);

  const dateFormat = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }), [locale]);
  const dateText = dateFormat.format(new Date(Date.UTC(date.year, date.month - 1, date.day)));
  const zoneText = useMemo(() => {
    if (!timeZone) return null;
    try {
      const part = new Intl.DateTimeFormat(locale, { timeZoneName: "long", timeZone }).formatToParts(new Date()).find((p) => p.type === "timeZoneName");
      return part ? `${part.value} (${timeZone.replace(/_/g, " ")})` : timeZone;
    } catch {
      return timeZone;
    }
  }, [timeZone, locale]);

  const slots = status.kind === "ready" ? status.slots : [];
  const chosen = slots.find((s) => s.time === slot);
  const app = resolvePermission(permissions?.confirm);
  const permission: PermissionValue | undefined = !app.isAllowed ? permissions?.confirm : chosen ? undefined : { state: "disabled" };
  const confirm = useCallback(async () => {
    if (chosen) await onSelect?.({ date: key, slot: chosen });
  }, [chosen, onSelect, key]);

  let body;
  if (status.kind === "loading") {
    body = (
      <div aria-hidden="true" className="grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} variant="rect" height={40} />
        ))}
      </div>
    );
  } else if (status.kind === "error") {
    body = (
      <ErrorState
        variant="inline"
        title="Couldn't load times"
        actions={
          <Button variant="secondary" onPress={() => setAttempt((n) => n + 1)}>
            Try again
          </Button>
        }
      />
    );
  } else if (slots.length === 0) {
    body = <EmptyState size="sm" title="No times left on this day" description="Pick another day to see its times." />;
  } else {
    body = (
      <RadioGroup
        aria-label={`${label} for ${dateText}`}
        value={slot}
        onChange={setSlot}
        className={cx("grid grid-cols-2 gap-2", classNames?.slotList)}
      >
        {slots.map((s) => {
          const text = formatSlot(s.time, locale, timeZone);
          return (
            <Radio
              key={s.time}
              value={s.time}
              isDisabled={!s.available}
              className={cx(
                "flex min-h-10 cursor-pointer items-center justify-center rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] px-3 py-2 text-sm font-medium tabular-nums outline-none",
                "bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)] transition-colors motion-reduce:transition-none",
                "data-[hovered]:border-[var(--rd-color-border-strong)] data-[hovered]:bg-[var(--rd-color-surface-subtle)]",
                "data-[selected]:border-[var(--rd-color-action-primary)] data-[selected]:bg-[var(--rd-color-action-primary)] data-[selected]:text-[var(--rd-color-action-on-primary)]",
                "data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
                "data-[disabled]:cursor-not-allowed data-[disabled]:bg-[var(--rd-color-surface-subtle)] data-[disabled]:text-[var(--rd-color-text-muted)] data-[disabled]:line-through",
                classNames?.slot,
              )}
            >
              <span title={!s.available ? s.reason : undefined}>{text}</span>
              {!s.available && <span className="sr-only">{`, unavailable${s.reason ? `, ${s.reason}` : ""}`}</span>}
            </Radio>
          );
        })}
      </RadioGroup>
    );
  }

  const reasons = slots.filter((s) => !s.available && s.reason);

  return (
    <div className={cx("flex w-full flex-wrap items-start gap-6", classNames?.root, className)}>
      <Calendar
        aria-label="Choose a date"
        value={date}
        minValue={min}
        onChange={(next) => {
          if (!next) return;
          const d = new CalendarDate(next.year, next.month, next.day);
          setDate(d);
          onDateChange?.(d.toString());
        }}
        className={classNames?.calendar}
      />
      <div className={cx("flex min-w-[16rem] flex-1 flex-col gap-3", classNames?.slots)} aria-busy={status.kind === "loading" || undefined}>
        <h3 id={headingId} className={cx("text-sm font-semibold text-[var(--rd-color-text-default)]", classNames?.heading)}>
          {dateText}
        </h3>
        <p role="status" className="sr-only">
          {status.kind === "loading"
            ? "Loading times"
            : status.kind === "ready"
              ? slots.length === 0
                ? `No times available on ${dateText}`
                : `${slots.filter((s) => s.available).length} times available on ${dateText}`
              : ""}
        </p>
        {body}
        {reasons.length > 0 && (
          <p className="text-xs text-[var(--rd-color-text-muted)]">Taken times are crossed out. Hover or read them for the reason.</p>
        )}
        {zoneText && (
          <p className={cx("flex items-center gap-1.5 text-xs text-[var(--rd-color-text-muted)]", classNames?.timeZone)}>
            <ClockIcon className="size-3.5 shrink-0" />
            Times shown in {zoneText}
          </p>
        )}
        <div className={cx("flex justify-end pt-1", classNames?.footer)}>
          <ActionButton permission={permission} onAction={confirm} className={classNames?.confirmButton}>
            {confirmLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
