import { TimeSlotPicker } from "@rdloom/react";

// getSlots may return a promise. Weekends have no times, so they show the empty message.
async function loadSlots(date: string) {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (day === 0 || day === 6) return [];
  return ["10:00", "11:00", "13:00", "14:00", "16:00"].map((t) => ({ time: `${date}T${t}`, available: true }));
}

export default function TimeSlotPickerAsyncSlotsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-2xl">
        <TimeSlotPicker today="2026-10-08" getSlots={loadSlots} onSelect={() => {}} />
      </div>
    </div>
  );
}
