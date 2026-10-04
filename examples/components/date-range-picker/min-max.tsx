import { getLocalTimeZone, today } from "@internationalized/date";
import { DateRangePicker } from "@rdloom/react";

export default function DateRangePickerMinMaxExample() {
  const now = today(getLocalTimeZone());
  return (
    <DateRangePicker className="w-80" label="Booking" description="Up to 60 days ahead" minValue={now} maxValue={now.add({ days: 60 })} />
  );
}
