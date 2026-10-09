"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Button as AriaButton, DialogTrigger } from "react-aria-components";
import { CalendarDate, getLocalTimeZone, parseDate, today as todayIn } from "@internationalized/date";
import { eventCalendarDefaults, type EventCalendarSpecProps } from "../generated/event-calendar.types";
import { Button } from "../button/button";
import { EmptyState } from "../empty-state/empty-state";
import { ErrorState } from "../error-state/error-state";
import { Popover } from "../popover/popover";
import { Skeleton } from "../skeleton/skeleton";
import { cx } from "../utils/cx";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "../utils/icons";
import { resolvePermission } from "../utils/permissions";
import { StateBoundary } from "../utils/state-boundary";
import { useDefaultLocale } from "../utils/use-default-locale";

export interface EventCalendarEvent {
  id: string;
  title: string;
  /** ISO start: 2026-10-12 or 2026-10-12T09:30. */
  start: string;
  end?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  allDay?: boolean;
}

export interface EventCalendarProps extends EventCalendarSpecProps {
  className?: string;
}

const tones: Record<NonNullable<EventCalendarEvent["tone"]>, { box: string; dot: string }> = {
  neutral: { box: "bg-[var(--rd-color-surface-subtle)]", dot: "bg-[var(--rd-color-text-muted)]" },
  info: { box: "bg-[var(--rd-color-feedback-info-subtle)]", dot: "bg-[var(--rd-color-feedback-info)]" },
  success: { box: "bg-[var(--rd-color-feedback-success-subtle)]", dot: "bg-[var(--rd-color-feedback-success)]" },
  warning: { box: "bg-[var(--rd-color-feedback-warning-subtle)]", dot: "bg-[var(--rd-color-feedback-warning)]" },
  danger: { box: "bg-[var(--rd-color-feedback-danger-subtle)]", dot: "bg-[var(--rd-color-feedback-danger)]" },
};

const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

function parseIso(value: string) {
  const m = ISO.exec(value);
  if (!m) return null;
  return { date: new CalendarDate(+m[1], +m[2], +m[3]), hour: m[4] === undefined ? null : +m[4], minute: m[5] === undefined ? null : +m[5] };
}

const monthKey = (d: CalendarDate) => `${String(d.year).padStart(4, "0")}-${String(d.month).padStart(2, "0")}`;
const startOfMonth = (d: CalendarDate) => d.set({ day: 1 });
const weekday = (d: CalendarDate) => new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
const utc = (d: CalendarDate) => new Date(Date.UTC(d.year, d.month - 1, d.day));

function parseMonth(value: string | undefined): CalendarDate | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})/.exec(value);
  return m ? new CalendarDate(+m[1], +m[2], 1) : null;
}

/** Adds months and keeps the day inside the new month. */
function addMonths(d: CalendarDate, n: number) {
  const first = startOfMonth(d).add({ months: n });
  return first.set({ day: Math.min(d.day, first.calendar.getDaysInMonth(first)) });
}

interface Chip {
  event: EventCalendarEvent;
  time: string | null;
}

/**
 * A month grid with events, role="grid". Arrow keys move between days, Page Up and Page Down change the month,
 * a day with many events shows +N more. The events and the month are yours. UI permission is not security: the
 * server must check again.
 */
export function EventCalendar({
  events,
  month,
  defaultMonth,
  onMonthChange,
  weekStartsOn = eventCalendarDefaults.weekStartsOn,
  locale: localeProp,
  today: todayProp,
  maxEventsPerDay = eventCalendarDefaults.maxEventsPerDay,
  label = eventCalendarDefaults.label,
  onEventSelect,
  onDateSelect,
  onCreate,
  state = "ready",
  onRetry,
  permissions,
  classNames,
  className,
}: EventCalendarProps) {
  const locale = useDefaultLocale(localeProp);
  const titleId = useId();
  const todayDate = useMemo(() => {
    if (todayProp) {
      try {
        return parseDate(todayProp);
      } catch {
        /* fall through to the device date */
      }
    }
    return todayIn(getLocalTimeZone());
  }, [todayProp]);

  const [innerMonth, setInnerMonth] = useState<CalendarDate>(() => parseMonth(defaultMonth) ?? startOfMonth(todayDate));
  const visible = parseMonth(month) ?? innerMonth;
  const [active, setActive] = useState<CalendarDate>(() => {
    const first = parseMonth(month) ?? parseMonth(defaultMonth) ?? startOfMonth(todayDate);
    return first.year === todayDate.year && first.month === todayDate.month ? todayDate : first;
  });
  const [selected, setSelected] = useState<CalendarDate | null>(null);
  const [moreFor, setMoreFor] = useState<string | null>(null);
  const focusAfter = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const create = resolvePermission(permissions?.create);
  const showAdd = Boolean(onCreate) && create.isVisible;

  const fmt = useMemo(
    () => ({
      month: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }),
      weekdayShort: new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }),
      full: new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }),
      day: new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }),
      number: new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: "UTC" }),
      time: new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }),
    }),
    [locale],
  );
  const plural = useMemo(() => new Intl.PluralRules(locale), [locale]);
  const eventsWord = (n: number) => (plural.select(n) === "one" ? `${n} event` : `${n} events`);

  const weeks = useMemo(() => {
    const first = startOfMonth(visible);
    const lead = (weekday(first) - weekStartsOn + 7) % 7;
    const start = first.subtract({ days: lead });
    const days = first.calendar.getDaysInMonth(first);
    const rows = Math.ceil((lead + days) / 7);
    return Array.from({ length: rows }, (_, r) => Array.from({ length: 7 }, (_, c) => start.add({ days: r * 7 + c })));
  }, [visible, weekStartsOn]);

  const byDay = useMemo(() => {
    const map = new Map<string, Chip[]>();
    const rangeStart = weeks[0][0];
    const rangeEnd = weeks[weeks.length - 1][6];
    for (const event of events) {
      const s = parseIso(event.start);
      if (!s) continue;
      const e = event.end ? parseIso(event.end) : null;
      const last = e && e.date.compare(s.date) > 0 ? e.date : s.date;
      const timed = !event.allDay && s.hour !== null;
      const time = timed ? fmt.time.format(new Date(Date.UTC(2000, 0, 1, s.hour!, s.minute ?? 0))) : null;
      let day = s.date;
      for (let i = 0; i < 62 && day.compare(last) <= 0; i++, day = day.add({ days: 1 })) {
        if (day.compare(rangeStart) < 0 || day.compare(rangeEnd) > 0) continue;
        const key = day.toString();
        const list = map.get(key) ?? [];
        list.push({ event, time: day.compare(s.date) === 0 ? time : null });
        map.set(key, list);
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => Number(!!a.time) - Number(!!b.time) || a.event.start.localeCompare(b.event.start));
    }
    return map;
  }, [events, weeks, fmt]);

  const showMonth = (next: CalendarDate, keepFocus = false) => {
    if (!month) setInnerMonth(startOfMonth(next));
    onMonthChange?.(monthKey(next));
    setMoreFor(null);
    focusAfter.current = keepFocus;
  };

  const moveTo = (date: CalendarDate) => {
    setActive(date);
    focusAfter.current = true;
    if (date.month !== visible.month || date.year !== visible.year) showMonth(date, true);
  };

  const stepMonth = (n: number) => {
    const next = addMonths(active, n);
    setActive(next);
    showMonth(next, document.activeElement instanceof HTMLElement && !!gridRef.current?.contains(document.activeElement));
  };

  useEffect(() => {
    if (!focusAfter.current) return;
    focusAfter.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${active.toString()}"]`)?.focus();
  });

  // Keep the one tab stop inside the visible month when the month changes from outside.
  const activeInView = weeks.some((w) => w.some((d) => d.compare(active) === 0));
  const stop = activeInView ? active : weeks[0].find((d) => d.month === visible.month)!;

  const onCellKey = (e: KeyboardEvent<HTMLDivElement>, date: CalendarDate) => {
    if (e.target !== e.currentTarget) return;
    const go = (d: CalendarDate) => {
      e.preventDefault();
      moveTo(d);
    };
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    switch (e.key) {
      case "ArrowLeft":
        return go(date.add({ days: rtl ? 1 : -1 }));
      case "ArrowRight":
        return go(date.add({ days: rtl ? -1 : 1 }));
      case "ArrowUp":
        return go(date.subtract({ days: 7 }));
      case "ArrowDown":
        return go(date.add({ days: 7 }));
      case "Home":
        return go(date.subtract({ days: (weekday(date) - weekStartsOn + 7) % 7 }));
      case "End":
        return go(date.add({ days: 6 - ((weekday(date) - weekStartsOn + 7) % 7) }));
      case "PageUp":
        e.preventDefault();
        return stepMonth(-1);
      case "PageDown":
        e.preventDefault();
        return stepMonth(1);
      case "Enter":
      case " ":
        e.preventDefault();
        setSelected(date);
        onDateSelect?.(date.toString());
    }
  };

  const heading = fmt.month.format(utc(startOfMonth(visible)));
  const weekdays = weeks[0].map((d) => ({ short: fmt.weekdayShort.format(utc(d)), long: fmt.weekdayLong.format(utc(d)), key: weekday(d) }));

  const header = (
    <div className={cx("flex flex-wrap items-center justify-between gap-2", classNames?.header)}>
      <h2 id={titleId} aria-live="polite" className={cx("text-base font-semibold text-[var(--rd-color-text-default)]", classNames?.title)}>
        {heading}
      </h2>
      <div role="group" aria-label="Change month" className={cx("flex items-center gap-1", classNames?.nav)}>
        <Button variant="secondary" size="sm" aria-label="Previous month" onPress={() => stepMonth(-1)}>
          <ChevronLeftIcon className="size-4 rtl:rotate-180" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onPress={() => {
            setActive(todayDate);
            showMonth(todayDate);
          }}
        >
          Today
        </Button>
        <Button variant="secondary" size="sm" aria-label="Next month" onPress={() => stepMonth(1)}>
          <ChevronRightIcon className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );

  const loading = (
    <div aria-hidden="true" className="grid grid-cols-7 gap-px overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-border-default)]">
      {Array.from({ length: 35 }, (_, i) => (
        <div key={i} className="min-h-20 bg-[var(--rd-color-surface-default)] p-2">
          <Skeleton variant="text" width="1.5rem" />
        </div>
      ))}
    </div>
  );

  const rtlFlip = "rtl:text-end";

  return (
    <div className={cx("flex w-full min-w-0 flex-col gap-3", classNames?.root, className)} aria-busy={state === "loading" || undefined}>
      {header}
      <StateBoundary
        state={state}
        loading={
          <>
            <p role="status" className="sr-only">
              Loading events
            </p>
            {loading}
          </>
        }
        empty={
          <EmptyState
            size="sm"
            title="No events this month"
            description="Events show here once they are scheduled."
          >
            {showAdd && (
              <Button variant="secondary" size="sm" isDisabled={create.isDisabled} onPress={() => onCreate?.(todayDate.toString())}>
                Add an event
              </Button>
            )}
          </EmptyState>
        }
        error={
          <ErrorState
            variant="inline"
            title="Couldn't load events"
            actions={
              onRetry && (
                <Button variant="secondary" onPress={onRetry}>
                  Try again
                </Button>
              )
            }
          />
        }
      >
        <div
          ref={gridRef}
          role="grid"
          aria-label={`${label}, ${heading}`}
          className={cx(
            "overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-border-default)]",
            classNames?.grid,
          )}
        >
          <div role="row" className="grid grid-cols-7 gap-px">
            {weekdays.map((d) => (
              <div
                key={d.key}
                role="columnheader"
                className={cx("bg-[var(--rd-color-surface-subtle)] px-2 py-1.5 text-xs font-medium text-[var(--rd-color-text-muted)]", classNames?.weekday)}
              >
                <span aria-hidden="true">{d.short}</span>
                <span className="sr-only">{d.long}</span>
              </div>
            ))}
          </div>
          {weeks.map((week) => (
            <div key={week[0].toString()} role="row" className="mt-px grid grid-cols-7 gap-px">
              {week.map((date) => {
                const key = date.toString();
                const chips = byDay.get(key) ?? [];
                const shown = chips.slice(0, Math.max(0, maxEventsPerDay));
                const rest = chips.length - shown.length;
                const outside = date.month !== visible.month || date.year !== visible.year;
                const isToday = date.compare(todayDate) === 0;
                const isStop = date.compare(stop) === 0;
                const isSelected = selected?.compare(date) === 0;
                const inner = isStop ? 0 : -1;
                const full = fmt.full.format(utc(date));
                const name = `${full}, ${eventsWord(chips.length)}${isToday ? ", today" : ""}`;
                return (
                  <div
                    key={key}
                    role="gridcell"
                    aria-label={name}
                    aria-selected={isSelected || undefined}
                    tabIndex={isStop ? 0 : -1}
                    data-date={key}
                    data-today={isToday || undefined}
                    data-outside-month={outside || undefined}
                    onKeyDown={(e) => onCellKey(e, date)}
                    onClick={(e) => {
                      if (e.target !== e.currentTarget && (e.target as HTMLElement).closest("button")) return;
                      setActive(date);
                      setSelected(date);
                      onDateSelect?.(key);
                    }}
                    className={cx(
                      "group relative flex min-h-11 min-w-0 flex-col gap-1 sm:min-h-24 bg-[var(--rd-color-surface-default)] p-1.5 outline-none",
                      "hover:bg-[var(--rd-color-surface-subtle)] focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--rd-color-focus-ring)]",
                      outside && "bg-[var(--rd-color-surface-subtle)] text-[var(--rd-color-text-muted)]",
                      isSelected && "bg-[var(--rd-color-surface-selected)]",
                      classNames?.day,
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cx(
                          "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                          isToday ? "bg-[var(--rd-color-action-primary)] font-semibold text-[var(--rd-color-action-on-primary)]" : outside ? "text-[var(--rd-color-text-muted)]" : "text-[var(--rd-color-text-default)]",
                          classNames?.dayNumber,
                        )}
                      >
                        <span aria-hidden="true">{fmt.number.format(utc(date))}</span>
                      </span>
                      {showAdd && (
                        <AriaButton
                          aria-label={`Add event on ${fmt.day.format(utc(date))}${create.isDisabled && create.reason ? `. ${create.reason}` : ""}`}
                          aria-disabled={create.isDisabled || undefined}
                          excludeFromTabOrder={!isStop}
                          onPress={() => {
                            if (create.isAllowed) onCreate?.(key);
                          }}
                          className={cx(
                            "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-[var(--rd-radius-control)] text-[var(--rd-color-text-muted)] outline-none",
                            // Hidden until the day is hovered or focused, except on a touch screen, where there is no hover.
                            "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 data-[focus-visible]:opacity-100 data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] [@media(hover:none)]:opacity-70",
                            "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
                            create.isDisabled && "cursor-not-allowed opacity-0 group-hover:opacity-50 group-focus-within:opacity-50",
                            classNames?.addButton,
                          )}
                        >
                          <PlusIcon className="size-3.5" />
                        </AriaButton>
                      )}
                    </div>
                    {chips.length > 0 && (
                      <DialogTrigger isOpen={moreFor === `d:${key}`} onOpenChange={(open) => setMoreFor(open ? `d:${key}` : null)}>
                        <AriaButton
                          aria-label={`Show ${eventsWord(chips.length)} on ${fmt.day.format(utc(date))}`}
                          excludeFromTabOrder={!isStop}
                          className={cx(
                            "absolute inset-0 flex items-end gap-1 p-1.5 outline-none sm:hidden",
                            "data-[focus-visible]:ring-2 data-[focus-visible]:ring-inset data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
                          )}
                        >
                          <span aria-hidden="true" className="flex items-center gap-0.5">
                            {chips.slice(0, 3).map(({ event }) => (
                              <span key={event.id} className={cx("size-1.5 rounded-full", tones[event.tone ?? "neutral"].dot)} />
                            ))}
                            {chips.length > 3 && (
                              <span className="ms-0.5 text-[10px] font-medium leading-none text-[var(--rd-color-text-muted)]">+{chips.length - 3}</span>
                            )}
                          </span>
                        </AriaButton>
                        <Popover label={`Events on ${fmt.day.format(utc(date))}`} showArrow={false} placement="bottom" className={cx("w-[min(20rem,calc(100vw-2rem))]", classNames?.popover)}>
                          <ul className="flex flex-col gap-1 p-1">
                            {chips.map(({ event, time }) => (
                              <li key={event.id}>
                                <EventButton
                                  large
                                  event={event}
                                  time={time}
                                  onPress={() => {
                                    setMoreFor(null);
                                    onEventSelect?.(event);
                                  }}
                                  className={classNames?.event}
                                />
                              </li>
                            ))}
                          </ul>
                        </Popover>
                      </DialogTrigger>
                    )}
                    <ul className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                      {shown.map(({ event, time }) => (
                        <li key={event.id} className="min-w-0">
                          <EventButton event={event} time={time} tabIndex={inner} onPress={() => onEventSelect?.(event)} className={classNames?.event} />
                        </li>
                      ))}
                    </ul>
                    {rest > 0 && (
                      <DialogTrigger isOpen={moreFor === key} onOpenChange={(open) => setMoreFor(open ? key : null)}>
                        <AriaButton
                          aria-label={`${rest} more ${plural.select(rest) === "one" ? "event" : "events"} on ${fmt.day.format(utc(date))}`}
                          excludeFromTabOrder={!isStop}
                          className={cx(
                            "hidden w-full truncate rounded-[var(--rd-radius-control)] px-1.5 py-0.5 text-start text-xs font-medium sm:block text-[var(--rd-color-text-muted)] outline-none",
                            "data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
                            rtlFlip,
                            classNames?.more,
                          )}
                        >
                          +{rest} more
                        </AriaButton>
                        <Popover label={`Events on ${fmt.day.format(utc(date))}`} showArrow={false} placement="bottom" className={cx("w-64", classNames?.popover)}>
                          <ul className="flex flex-col gap-1 p-1">
                            {chips.map(({ event, time }) => (
                              <li key={event.id}>
                                <EventButton
                                  event={event}
                                  time={time}
                                  onPress={() => {
                                    setMoreFor(null);
                                    onEventSelect?.(event);
                                  }}
                                  className={classNames?.event}
                                />
                              </li>
                            ))}
                          </ul>
                        </Popover>
                      </DialogTrigger>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </StateBoundary>
    </div>
  );
}

function EventButton({
  event,
  time,
  tabIndex,
  onPress,
  className,
  large,
}: {
  event: EventCalendarEvent;
  time: string | null;
  tabIndex?: number;
  onPress: () => void;
  className?: string;
  large?: boolean;
}) {
  const tone = tones[event.tone ?? "neutral"];
  return (
    <AriaButton
      onPress={onPress}
      excludeFromTabOrder={tabIndex === -1}
      className={cx(
        "flex w-full min-w-0 items-center gap-1.5 rounded-[var(--rd-radius-control)] text-start text-[var(--rd-color-text-default)] outline-none",
        large ? "min-h-11 px-3 text-sm" : "min-h-6 min-w-6 px-1.5 py-0.5 text-xs",
        "data-[hovered]:brightness-95 data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
        tone.box,
        className,
      )}
    >
      <span aria-hidden="true" className={cx("size-1.5 shrink-0 rounded-full", tone.dot)} />
      {time && <span className="shrink-0 tabular-nums text-[var(--rd-color-text-muted)]">{time}</span>}
      <span className="truncate font-medium">{event.title}</span>
    </AriaButton>
  );
}
