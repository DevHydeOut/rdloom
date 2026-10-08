import { EventCalendar } from "@rdloom/react";

export default function EventCalendarStatesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <EventCalendar events={[]} state="loading" defaultMonth="2026-10" today="2026-10-08" label="Loading calendar" />
        <EventCalendar events={[]} state="empty" defaultMonth="2026-10" today="2026-10-08" label="Empty calendar" />
        <EventCalendar events={[]} state="error" onRetry={() => {}} defaultMonth="2026-10" today="2026-10-08" label="Failed calendar" />
      </div>
    </div>
  );
}
