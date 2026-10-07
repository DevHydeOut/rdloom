import { useState } from "react";
import { TopNav, type NavItem } from "@rdloom/react";

// The app decides what each person may do. Billing is hidden, Reports is shown but explained, and Admin (a parent whose
// children are all hidden) disappears. The server must still check every request: this only changes what people see.
const items: NavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "reports", label: "Reports", permission: { state: "disabled", reason: "Reports are part of the Team plan" } },
  { id: "billing", label: "Billing", permission: "hidden" },
  { id: "admin", label: "Admin", children: [{ id: "roles", label: "Roles", permission: "hidden" }] },
];

export default function TopNavPermissionsExample() {
  const [current, setCurrent] = useState("overview");
  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <TopNav brand="Loomworks" items={items} currentId={current} onNavigate={(item) => setCurrent(item.id)} variant="bordered" />
      <div className="h-24" />
    </div>
  );
}
