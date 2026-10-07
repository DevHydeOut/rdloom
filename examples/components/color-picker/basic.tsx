import { useState } from "react";
import { ColorPicker } from "@rdloom/react";

export default function ColorPickerBasicExample() {
  const [color, setColor] = useState("#d9480f");

  return (
    <div className="flex justify-center p-6">
      <div className="w-64">
        <ColorPicker label="Brand color" value={color} onChange={setColor} description={`Chosen: ${color}`} />
      </div>
    </div>
  );
}
