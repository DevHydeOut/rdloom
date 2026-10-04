import { getLocalTimeZone, today } from "@internationalized/date";
import { DatePicker } from "@rdloom/react";

export default function DatePickerMinMaxExample() {
  const now = today(getLocalTimeZone());
  return (
    <DatePicker className="w-64" label="Delivery" description="Within the next 2 weeks" minValue={now} maxValue={now.add({ weeks: 2 })} />
  );
}
