import { Calendar } from "@rdloom/react";

export default function CalendarBorderedWithSelectorsExample() {
  return (
    <div className="flex w-full justify-center">
      <Calendar aria-label="Appointment date" bordered captionLayout="dropdowns" />
    </div>
  );
}
