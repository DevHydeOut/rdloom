import { DatePicker } from "@rdloom/react";

export default function DatePickerWithTimeExample() {
  return (
    <DatePicker className="w-72" label="Meeting" granularity="minute" />
  );
}
