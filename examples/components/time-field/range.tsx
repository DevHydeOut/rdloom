import { Time } from "@internationalized/date";
import { TimeField } from "@rdloom/react";

// minValue and maxValue make times outside opening hours invalid.
export default function TimeFieldRangeExample() {
  return (
    <div className="w-64">
      <TimeField
        label="Pickup time"
        description="We are open 9:00 to 17:00."
        validationBehavior="aria"
        minValue={new Time(9)}
        maxValue={new Time(17)}
        defaultValue={new Time(20, 15)}
        errorMessage="Pick a time between 9:00 and 17:00."
      />
    </div>
  );
}
