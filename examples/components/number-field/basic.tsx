import { NumberField } from "@rdloom/react";

export default function NumberFieldBasicExample() {
  return (
    <div className="w-48">
      <NumberField label="Quantity" defaultValue={1} minValue={1} maxValue={99} description="Between 1 and 99." />
    </div>
  );
}
