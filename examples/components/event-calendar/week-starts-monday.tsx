import { EventCalendar, type EventCalendarEvent } from "@rdloom/react";

const events: EventCalendarEvent[] = [
  { id: "1", title: "Wochenplanung", start: "2026-10-05T09:00", tone: "info" },
  { id: "2", title: "Lieferung Lager", start: "2026-10-09T11:30", tone: "warning" },
  { id: "3", title: "Tag der Deutschen Einheit", start: "2026-10-03", allDay: true, tone: "neutral" },
];

export default function EventCalendarWeekStartsMondayExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-4xl">
        <EventCalendar events={events} defaultMonth="2026-10" today="2026-10-08" weekStartsOn={1} locale="de-DE" label="Kalender" />
      </div>
    </div>
  );
}
