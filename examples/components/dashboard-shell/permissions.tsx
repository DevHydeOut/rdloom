import { useState } from "react";
import { ChartIcon, CreditCardIcon, DashboardShell, HomeIcon, SettingsIcon, UsersIcon, type NavGroup } from "@rdloom/react";

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

export default function DashboardShellPermissionsExample() {
  const [current, setCurrent] = useState("overview");
  return (
    <div className="h-[28rem] w-[56rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <DashboardShell navigation={navigation} currentId={current} brand="Acme" onNavigate={(item) => setCurrent(item.id)}>
        <p className="p-6 text-sm">Current page: {current}</p>
      </DashboardShell>
    </div>
  );
}
