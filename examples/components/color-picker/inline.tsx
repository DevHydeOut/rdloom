import { useState } from "react";
import { ColorPickerPanel } from "@rdloom/react";

export default function ColorPickerInlineExample() {
  const [color, setColor] = useState("#6741d9");

  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <ColorPickerPanel label="Accent color" value={color} onChange={setColor} presets={["#6741d9", "#d9480f", "#2f9e44", "#1971c2"]} />
      <p className="text-sm" aria-live="polite">
        Accent color: {color}
      </p>
    </div>
  );
}
