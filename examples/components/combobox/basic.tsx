import { Combobox, ComboboxItem } from "@rdloom/react";

const countries = [
  { id: "in", name: "India" },
  { id: "jp", name: "Japan" },
  { id: "de", name: "Germany" },
  { id: "br", name: "Brazil" },
  { id: "ca", name: "Canada" },
  { id: "ke", name: "Kenya" },
];

export default function ComboboxBasicExample() {
  return (
    <Combobox className="w-64" label="Country" placeholder="Search countries" defaultItems={countries}>
      {(c) => <ComboboxItem id={c.id}>{c.name}</ComboboxItem>}
    </Combobox>
  );
}
