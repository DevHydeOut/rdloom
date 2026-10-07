import { useState } from "react";
import { TopNav, type NavItem } from "@rdloom/react";

const items: NavItem[] = [
  { id: "product", label: "Product" },
  { id: "pricing", label: "Pricing" },
  { id: "docs", label: "Docs" },
];

// classNames restyles one part without editing the file: a tinted frame, a heavier brand and rounder links.
export default function TopNavClassNamesExample() {
  const [current, setCurrent] = useState("product");
  return (
    <div className="mx-auto w-full max-w-4xl rounded-xl bg-[var(--rd-color-surface-subtle)] py-4">
      <TopNav
        brand="Loomworks"
        items={items}
        currentId={current}
        onNavigate={(item) => setCurrent(item.id)}
        variant="floating"
        classNames={{ brand: "font-bold tracking-tight", item: "!rounded-full", root: "bg-[var(--rd-color-surface-default)]" }}
      />
    </div>
  );
}
