import { DateRangePicker, defaultDateRangePresets } from "@rdloom/react";

export default function DateRangePickerWithPresetsExample() {
  return (
    <DateRangePicker className="w-80" label="Report period" presets={defaultDateRangePresets} />
  );
}
