import { Slider } from "@rdloom/react";

export default function SliderCurrencyExample() {
  return (
    <div className="w-72">
      {/* formatOptions is what's shown and what screen readers announce: "$250". */}
      <Slider
        label="Budget"
        defaultValue={250}
        maxValue={1000}
        step={50}
        formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
      />
    </div>
  );
}
