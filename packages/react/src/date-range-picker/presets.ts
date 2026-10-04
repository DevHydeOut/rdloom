import {
  endOfMonth,
  getLocalTimeZone,
  startOfMonth,
  startOfYear,
  today,
  type CalendarDate,
} from "@internationalized/date";

export interface DateRangePreset {
  /** Stable id, useful for analytics or saving a user's choice. */
  id: string;
  label: string;
  /** Builds the range from "today" in the picker's time zone. */
  range: (today: CalendarDate) => { start: CalendarDate; end: CalendarDate };
}

export const defaultDateRangePresets: DateRangePreset[] = [
  { id: "today", label: "Today", range: (t) => ({ start: t, end: t }) },
  { id: "last-7-days", label: "Last 7 days", range: (t) => ({ start: t.subtract({ days: 6 }), end: t }) },
  { id: "last-30-days", label: "Last 30 days", range: (t) => ({ start: t.subtract({ days: 29 }), end: t }) },
  { id: "this-month", label: "This month", range: (t) => ({ start: startOfMonth(t), end: t }) },
  {
    id: "last-month",
    label: "Last month",
    range: (t) => {
      const start = startOfMonth(t).subtract({ months: 1 });
      return { start, end: endOfMonth(start) };
    },
  },
  { id: "year-to-date", label: "Year to date", range: (t) => ({ start: startOfYear(t), end: t }) },
];

/**
 * Resolves a preset against today's date in `timeZone`. Using the picker's
 * zone matters near midnight: "today" in Tokyo is often "yesterday" in New York.
 */
export function resolvePreset(preset: DateRangePreset, timeZone: string = getLocalTimeZone()) {
  return preset.range(today(timeZone));
}
