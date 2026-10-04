import { useState } from "react";
import { Checkbox } from "@rdloom/react";

const platforms = [
  { id: "web", name: "Web" },
  { id: "ios", name: "iOS" },
  { id: "android", name: "Android" },
];

export default function CheckboxIndeterminateExample() {
  const [checked, setChecked] = useState(["web"]);
  const all = checked.length === platforms.length;
  const some = checked.length > 0 && !all;
  return (
    <div className="flex flex-col gap-2">
      <Checkbox isSelected={all} isIndeterminate={some} onChange={(on) => setChecked(on ? platforms.map((p) => p.id) : [])}>
        All platforms
      </Checkbox>
      <div className="flex flex-col gap-2 ps-6">
        {platforms.map((p) => (
          <Checkbox
            key={p.id}
            isSelected={checked.includes(p.id)}
            onChange={(on) => setChecked(on ? [...checked, p.id] : checked.filter((c) => c !== p.id))}
          >
            {p.name}
          </Checkbox>
        ))}
      </div>
    </div>
  );
}
