import { Time } from "@internationalized/date";
import { TimeField } from "@rdloom/react";

export default function TimeFieldBasicExample() {
  return (
    <div className="w-48">
      <TimeField label="Start time" defaultValue={new Time(9, 30)} />
    </div>
  );
}
