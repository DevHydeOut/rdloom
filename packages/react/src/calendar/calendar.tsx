"use client";

import {
  Button,
  Calendar as AriaCalendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Heading,
  RangeCalendar as AriaRangeCalendar,
  type CalendarProps as AriaCalendarProps,
  type DateValue,
  type RangeCalendarProps as AriaRangeCalendarProps,
} from "react-aria-components";
import { calendarDefaults, type CalendarSpecProps } from "../generated/calendar.types";
import { cx } from "../utils/cx";
import { ChevronLeftIcon, ChevronRightIcon } from "../utils/icons";

type Omitted = keyof CalendarSpecProps | "className" | "children" | "visibleDuration";

export interface CalendarProps extends CalendarSpecProps, Omit<AriaCalendarProps<DateValue>, Omitted> {
  className?: string;
}
export interface RangeCalendarProps extends CalendarSpecProps, Omit<AriaRangeCalendarProps<DateValue>, Omitted> {
  className?: string;
}

function NavButton({ slot }: { slot: "previous" | "next" }) {
  return (
    <Button
      slot={slot}
      className={
        "flex size-[var(--rd-size-control-sm)] items-center justify-center rounded-[var(--rd-radius-control)] outline-none " +
        "text-[var(--rd-color-text-muted)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[hovered]:text-[var(--rd-color-text-default)] " +
        "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[disabled]:opacity-40"
      }
    >
      {slot === "previous" ? <ChevronLeftIcon className="size-4 rtl:rotate-180" /> : <ChevronRightIcon className="size-4 rtl:rotate-180" />}
    </Button>
  );
}

const cellBase =
  "relative flex size-9 cursor-default items-center justify-center text-sm tabular-nums outline-none " +
  "text-[var(--rd-color-text-default)] data-[outside-month]:text-[var(--rd-color-text-muted)] data-[outside-month]:opacity-50 " +
  "data-[today]:font-semibold data-[today]:ring-1 data-[today]:ring-inset data-[today]:ring-[var(--rd-color-action-primary)] " +
  "data-[disabled]:opacity-40 data-[unavailable]:text-[var(--rd-color-text-muted)] data-[unavailable]:line-through data-[unavailable]:opacity-40 " +
  "data-[focus-visible]:z-10 data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

const singleCell =
  "rounded-[var(--rd-radius-control)] data-[hovered]:bg-[var(--rd-color-surface-subtle)] " +
  "data-[selected]:bg-[var(--rd-color-action-primary)] data-[selected]:text-[var(--rd-color-action-on-primary)] data-[selected]:ring-0 data-[selected]:[box-shadow:var(--rd-elevation-control)]";

// In a range, days between the ends get a soft band; the ends are solid.
const rangeCell =
  "data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[selected]:bg-[var(--rd-color-surface-selected)] " +
  "data-[selection-start]:rounded-s-[var(--rd-radius-control)] data-[selection-end]:rounded-e-[var(--rd-radius-control)] " +
  "data-[selection-start]:[box-shadow:var(--rd-elevation-control)] data-[selection-end]:[box-shadow:var(--rd-elevation-control)] " +
  "data-[selection-start]:bg-[var(--rd-color-action-primary)] data-[selection-start]:text-[var(--rd-color-action-on-primary)] " +
  "data-[selection-end]:bg-[var(--rd-color-action-primary)] data-[selection-end]:text-[var(--rd-color-action-on-primary)]";

function Grids({ visibleMonths, range }: { visibleMonths: number; range: boolean }) {
  return (
    <div className="flex flex-wrap gap-6">
      {Array.from({ length: visibleMonths }, (_, i) => (
        <CalendarGrid key={i} offset={i > 0 ? { months: i } : undefined} className="border-collapse">
          <CalendarGridHeader>
            {(day) => (
              <CalendarHeaderCell className="size-9 pb-1 text-xs font-medium text-[var(--rd-color-text-muted)]">
                {day}
              </CalendarHeaderCell>
            )}
          </CalendarGridHeader>
          <CalendarGridBody>
            {(date) => <CalendarCell date={date} className={cx(cellBase, range ? rangeCell : singleCell)} />}
          </CalendarGridBody>
        </CalendarGrid>
      ))}
    </div>
  );
}

function Header() {
  return (
    // A div, not <header>: outside sectioning content a header is a page-level
    // "banner" landmark, so every calendar would add one.
    <div className="flex items-center justify-between gap-2 pb-2">
      <NavButton slot="previous" />
      <Heading className="text-sm font-semibold text-[var(--rd-color-text-default)]" />
      <NavButton slot="next" />
    </div>
  );
}

export function Calendar({
  visibleMonths = calendarDefaults.visibleMonths,
  isDisabled = calendarDefaults.isDisabled,
  className,
  ...rest
}: CalendarProps) {
  return (
    <AriaCalendar
      {...rest}
      isDisabled={isDisabled}
      visibleDuration={{ months: visibleMonths }}
      className={cx("w-fit", className)}
    >
      <Header />
      <Grids visibleMonths={visibleMonths} range={false} />
    </AriaCalendar>
  );
}

export function RangeCalendar({
  visibleMonths = calendarDefaults.visibleMonths,
  isDisabled = calendarDefaults.isDisabled,
  className,
  ...rest
}: RangeCalendarProps) {
  return (
    <AriaRangeCalendar
      {...rest}
      isDisabled={isDisabled}
      visibleDuration={{ months: visibleMonths }}
      className={cx("w-fit", className)}
    >
      <Header />
      <Grids visibleMonths={visibleMonths} range />
    </AriaRangeCalendar>
  );
}
