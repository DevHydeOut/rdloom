import { useState } from "react";
import { Button, TopNav, type NavItem } from "@rdloom/react";

const items: NavItem[] = [
  { id: "product", label: "Product", children: [{ id: "invoicing", label: "Invoicing" }, { id: "payments", label: "Payments" }] },
  { id: "pricing", label: "Pricing" },
  { id: "docs", label: "Docs" },
];

// The bar follows the space it is in, not the screen: in this 22rem frame the links fold into a menu button that opens
// them in a sheet. Choosing a link closes the sheet. Only one of the two is in the page at a time.
export default function TopNavMobileMenuExample() {
  const [current, setCurrent] = useState("pricing");
  return (
    <div className="mx-auto w-[22rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <TopNav brand="Loomworks" items={items} currentId={current} onNavigate={(item) => setCurrent(item.id)} variant="bordered" actions={<Button size="sm">Sign in</Button>} />
      <div className="h-24" />
    </div>
  );
}
