import { useState } from "react";
import { ColorPicker } from "@rdloom/react";

export default function ColorPickerWithAlphaExample() {
  const [color, setColor] = useState("#1971c2cc");

  return (
    <div className="flex justify-center p-6">
      <div className="w-64">
        <ColorPicker label="Overlay color" showAlpha value={color} onChange={setColor} description="The value includes opacity: #rrggbbaa." />
      </div>
    </div>
  );
}
