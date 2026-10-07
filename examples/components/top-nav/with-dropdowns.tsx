import { useState } from "react";
import { TopNav, UserMenu, type NavItem } from "@rdloom/react";

// An item with children opens a short list. The parent of the current page is marked as the current section.
const items: NavItem[] = [
  {
    id: "products",
    label: "Products",
    children: [
      { id: "invoicing", label: "Invoicing", href: "#invoicing" },
      { id: "payments", label: "Payments", href: "#payments" },
      { id: "reports", label: "Reports", href: "#reports" },
    ],
  },
  { id: "pricing", label: "Pricing", href: "#pricing" },
  { id: "docs", label: "Docs", badge: "New", href: "#docs" },
];

export default function TopNavWithDropdownsExample() {
  const [current, setCurrent] = useState("payments");
  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] pb-40">
      <TopNav
        brand="Loomworks"
        items={items}
        currentId={current}
        onNavigate={(item) => setCurrent(item.id)}
        variant="bordered"
        actions={<UserMenu user={{ name: "Ada Lovelace", email: "ada@example.com" }} onSignOut={async () => {}} />}
      />
    </div>
  );
}
