import { TimeSlotPicker } from "@rdloom/react";

export default function TimeSlotPickerUnavailableTimesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-2xl">
        <TimeSlotPicker
          today="2026-10-08"
          timeZone="America/New_York"
          getSlots={(date) => [
            { time: `${date}T09:00`, available: false, reason: "Already booked" },
            { time: `${date}T09:30`, available: true },
            { time: `${date}T10:00`, available: false, reason: "Already booked" },
            { time: `${date}T10:30`, available: true },
            { time: `${date}T12:00`, available: false, reason: "Lunch break" },
            { time: `${date}T13:30`, available: true },
          ]}
          onSelect={() => {}}
          permissions={{ confirm: true }}
        />
      </div>
    </div>
  );
}
