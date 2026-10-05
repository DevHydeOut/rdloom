import { NumberField } from "@rdloom/react";

// Without the buttons it is a plain numeric field; the arrow keys still step it.
export default function NumberFieldStepperOffExample() {
  return (
    <div className="w-48">
      <NumberField label="Age" showStepper={false} minValue={0} maxValue={130} isRequired />
    </div>
  );
}
