import { useState } from "react";
import { ChartIcon, CreditCardIcon, HomeIcon, SettingsIcon, Sidebar, UsersIcon, type NavGroup } from "@rdloom/react";

// The app decides what each person may do. Billing is hidden for this person, Settings is shown but explained,
// and the Admin group disappears because everything in it is hidden. The server must still check every request.
const navigation: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { id: "overview", label: "Overview", icon: <HomeIcon /> },
      { id: "customers", label: "Customers", icon: <UsersIcon /> },
      { id: "reports", label: "Reports", icon: <ChartIcon />, permission: { state: "disabled", reason: "Reports are part of the Team plan" } },
    ],
  },
  {
    label: "Admin",
    items: [
      { id: "billing", label: "Billing", icon: <CreditCardIcon />, permission: "hidden" },
      { id: "settings", label: "Settings", icon: <SettingsIcon />, permission: "hidden" },
    ],
  },
];

export default function SidebarPermissionsExample() {
  const [current, setCurrent] = useState("overview");
  return (
    <div className="h-[22rem] w-64">
      <Sidebar navigation={navigation} currentId={current} brand="Acme" onNavigate={(item) => setCurrent(item.id)} />
    </div>
  );
}
