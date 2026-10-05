import { NumberField } from "@rdloom/react";

// formatOptions follows the visitor's locale for symbols and separators.
export default function NumberFieldCurrencyExample() {
  return (
    <div className="w-56">
      <NumberField
        label="Budget"
        defaultValue={1500}
        step={50}
        minValue={0}
        formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
      />
    </div>
  );
}
