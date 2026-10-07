import { useState } from "react";
import { Button, TopNav, type NavItem } from "@rdloom/react";

const items: NavItem[] = [
  { id: "product", label: "Product" },
  { id: "pricing", label: "Pricing" },
  { id: "docs", label: "Docs" },
  { id: "about", label: "About" },
];

// Items without an href are buttons: onNavigate does the work. The current one has aria-current and a bar under it.
export default function TopNavBasicExample() {
  const [current, setCurrent] = useState("pricing");
  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <TopNav
        brand="Loomworks"
        items={items}
        currentId={current}
        onNavigate={(item) => setCurrent(item.id)}
        variant="bordered"
        actions={
          <>
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
            <Button size="sm">Start free</Button>
          </>
        }
      />
      <div className="h-24" />
    </div>
  );
}
