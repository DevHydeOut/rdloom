import { Combobox, ComboboxItem } from "@rdloom/react";

const products = Array.from({ length: 5000 }, (_, i) => ({ id: `p${i}`, name: `Product ${String(i + 1).padStart(4, "0")}` }));

export default function ComboboxVirtualizedExample() {
  return (
    <Combobox className="w-64" label="Product" description="5,000 options" virtualized defaultItems={products} placeholder="Search products">
      {(p) => <ComboboxItem id={p.id}>{p.name}</ComboboxItem>}
    </Combobox>
  );
}
