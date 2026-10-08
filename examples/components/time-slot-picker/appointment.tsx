import { useState } from "react";
import { TimeSlotPicker } from "@rdloom/react";

const times = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00"];

export default function TimeSlotPickerAppointmentExample() {
  const [booked, setBooked] = useState<string | null>(null);
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <TimeSlotPicker
          today="2026-10-08"
          timeZone="Europe/Berlin"
          getSlots={(date) => times.map((t) => ({ time: `${date}T${t}`, available: true }))}
          onSelect={({ date, slot }) => setBooked(`Booked ${date} at ${slot.time.slice(11, 16)}`)}
          confirmLabel="Book appointment"
        />
        <p role="status" className="text-sm text-[var(--rd-color-text-muted)]">
          {booked ?? "Choose a day and a time."}
        </p>
      </div>
    </div>
  );
}
