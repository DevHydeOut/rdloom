import { Time } from "@internationalized/date";
import { TimeField } from "@rdloom/react";

export default function TimeFieldSecondsExample() {
  return (
    <div className="flex flex-col gap-4">
      <div className="w-56">
        <TimeField label="Timestamp" granularity="second" defaultValue={new Time(14, 5, 30)} />
      </div>
      <div className="w-48">
        <TimeField label="24 hour clock" hourCycle={24} defaultValue={new Time(18, 0)} />
      </div>
    </div>
  );
}
