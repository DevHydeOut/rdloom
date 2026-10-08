import { useState } from "react";
import { ChartIcon, CreditCardIcon, HomeIcon, SettingsIcon, Sidebar, Skeleton, UsersIcon, type NavGroup } from "@rdloom/react";

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

// Placeholder page content: decorative skeleton blocks shaped like a page header, stat cards, a chart and a table.
function PageSkeleton() {
  return (
    <div aria-hidden="true" className="flex h-full min-w-0 flex-1 flex-col gap-6 overflow-auto bg-[var(--rd-color-surface-default)] p-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton variant="rect" width={200} height={28} />
        <Skeleton variant="rect" width={110} height={36} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-[var(--rd-color-border-default)] p-4">
            <Skeleton variant="rect" width={90} height={12} />
            <Skeleton variant="rect" width={140} height={28} />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[var(--rd-color-border-default)] p-4">
        <Skeleton variant="rect" height={200} />
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--rd-color-border-default)] p-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rect" height={20} />
        ))}
      </div>
    </div>
  );
}

export default function SidebarPermissionsExample() {
  const [current, setCurrent] = useState("overview");
  return (
    <div className="flex h-full w-full">
      <Sidebar navigation={navigation} currentId={current} brand="Acme" user={{ name: "Ada Lovelace", email: "ada@example.com", menu: [{ id: "out", label: "Sign out", onSelect: () => {} }] }} onNavigate={(item) => setCurrent(item.id)} />
      <PageSkeleton />
    </div>
  );
}
