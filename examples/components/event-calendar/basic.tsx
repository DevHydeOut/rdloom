import { useState } from "react";
import { EventCalendar, type EventCalendarEvent } from "@rdloom/react";

const events: EventCalendarEvent[] = [
  { id: "1", title: "Design review", start: "2026-10-06T10:00", tone: "info" },
  { id: "2", title: "Sprint planning", start: "2026-10-12T09:30", tone: "success" },
  { id: "3", title: "Vendor call", start: "2026-10-12T13:00", tone: "neutral" },
  { id: "4", title: "Budget sync", start: "2026-10-12T15:30", tone: "warning" },
  { id: "5", title: "Retro", start: "2026-10-12T16:30", tone: "info" },
  { id: "6", title: "Team offsite", start: "2026-10-20", end: "2026-10-22", allDay: true, tone: "success" },
  { id: "7", title: "Release freeze", start: "2026-10-28", allDay: true, tone: "danger" },
];

export default function EventCalendarBasicExample() {
  const [picked, setPicked] = useState<string>("Nothing picked yet");
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-4xl flex-col gap-3">
        <EventCalendar
          events={events}
          defaultMonth="2026-10"
          today="2026-10-08"
          onEventSelect={(event) => setPicked(`Event: ${event.title}`)}
          onDateSelect={(date) => setPicked(`Day: ${date}`)}
        />
        <p role="status" className="text-sm text-[var(--rd-color-text-muted)]">
          {picked}
        </p>
      </div>
    </div>
  );
}
