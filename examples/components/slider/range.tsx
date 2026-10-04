import { useState } from "react";
import { Slider } from "@rdloom/react";

export default function SliderRangeExample() {
  const [committed, setCommitted] = useState<number | number[]>([20, 60]);

  return (
    <div className="flex w-72 flex-col gap-2">
      {/* Two values make two thumbs. onChangeEnd fires once, when the user lets go. */}
      <Slider label="Age" defaultValue={[20, 60]} minValue={18} maxValue={99} onChangeEnd={setCommitted} />
      <p className="text-sm">Searching ages {Array.isArray(committed) ? committed.join("–") : committed}</p>
    </div>
  );
}
