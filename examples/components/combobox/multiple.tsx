import { Combobox, ComboboxItem } from "@rdloom/react";

const countries = [
  { id: "in", name: "India" },
  { id: "jp", name: "Japan" },
  { id: "de", name: "Germany" },
  { id: "br", name: "Brazil" },
  { id: "ca", name: "Canada" },
  { id: "ke", name: "Kenya" },
];

export default function ComboboxMultipleExample() {
  return (
    <Combobox
      className="w-72"
      label="Markets"
      selectionMode="multiple"
      placeholder="Add markets"
      defaultItems={countries}
      defaultValue={["in", "jp"]}
    >
      {(c) => <ComboboxItem id={c.id}>{c.name}</ComboboxItem>}
    </Combobox>
  );
}
