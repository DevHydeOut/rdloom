import { Calendar } from "@rdloom/react";

export default function CalendarBorderedExample() {
  return (
    <div className="flex w-full justify-center">
      <Calendar aria-label="Delivery date" bordered />
    </div>
  );
}
