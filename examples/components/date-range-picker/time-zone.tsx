import { DateRangePicker, defaultDateRangePresets } from "@rdloom/react";

export default function DateRangePickerTimeZoneExample() {
  return (
    <DateRangePicker
      className="w-80"
      label="Tokyo office hours"
      description="Presets like Today use Tokyo's date"
      presets={defaultDateRangePresets}
      timeZone="Asia/Tokyo"
    />
  );
}
