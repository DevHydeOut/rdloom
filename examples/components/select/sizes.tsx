import { Select, SelectItem } from "@rdloom/react";

export default function SelectSizesExample() {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Select key={size} className="w-40" label={`Size ${size}`} size={size} defaultSelectedKey="a">
          <SelectItem id="a">Option A</SelectItem>
          <SelectItem id="b">Option B</SelectItem>
        </Select>
      ))}
    </div>
  );
}
