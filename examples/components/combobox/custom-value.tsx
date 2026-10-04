import { Combobox, ComboboxItem } from "@rdloom/react";

const tags = [
  { id: "bug", name: "bug" },
  { id: "feature", name: "feature" },
  { id: "docs", name: "docs" },
];

export default function ComboboxCustomValueExample() {
  return (
    <Combobox className="w-64" label="Tag" description="Pick one or type your own" allowsCustomValue defaultItems={tags}>
      {(t) => <ComboboxItem id={t.id}>{t.name}</ComboboxItem>}
    </Combobox>
  );
}
