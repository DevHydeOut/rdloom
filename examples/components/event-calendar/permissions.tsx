import { EventCalendar, type EventCalendarEvent } from "@rdloom/react";

const events: EventCalendarEvent[] = [
  { id: "1", title: "Stand-up", start: "2026-10-07T09:00", tone: "info" },
  { id: "2", title: "Client demo", start: "2026-10-14T14:00", tone: "success" },
];

// The server must still refuse a create: UI permission is not security.
export default function EventCalendarPermissionsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Can create</h3>
          <EventCalendar events={events} defaultMonth="2026-10" today="2026-10-08" label="Team calendar" onCreate={() => {}} permissions={{ create: true }} />
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Read only</h3>
          <EventCalendar
            events={events}
            defaultMonth="2026-10"
            today="2026-10-08"
            label="Shared calendar"
            onCreate={() => {}}
            permissions={{ create: { state: "disabled", reason: "Only organizers can add events." } }}
          />
        </section>
      </div>
    </div>
  );
}
