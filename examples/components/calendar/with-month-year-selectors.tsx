import { parseDate } from "@internationalized/date";
import { Calendar } from "@rdloom/react";

export default function CalendarMonthYearSelectorsExample() {
  return (
    <div className="flex w-full justify-center">
      <Calendar aria-label="Birth date" captionLayout="dropdowns" defaultFocusedValue={parseDate("1990-06-15")} />
    </div>
  );
}
