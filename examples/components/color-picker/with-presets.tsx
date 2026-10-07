import { ColorPicker } from "@rdloom/react";

const presets = ["#d9480f", "#c2255c", "#6741d9", "#1971c2", "#0c8599", "#2f9e44", "#f08c00", "#495057"];

export default function ColorPickerWithPresetsExample() {
  return (
    <div className="flex justify-center p-6">
      <div className="w-64">
        <ColorPicker label="Label color" defaultValue="#1971c2" presets={presets} format="rgb" />
      </div>
    </div>
  );
}
