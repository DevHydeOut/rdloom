import { getLocalTimeZone, today } from "@internationalized/date";
import { Calendar } from "@rdloom/react";

export default function CalendarMinMaxExample() {
  const now = today(getLocalTimeZone());
  return (
    <Calendar aria-label="Appointment" minValue={now} maxValue={now.add({ days: 30 })} />
  );
}
