import { useState } from "react";
import { ChartIcon, DashboardPage, DashboardShell, HomeIcon, SettingsIcon, UsersIcon, findNavItem, type NavGroup } from "@rdloom/react";

// An item with `children` opens and closes a short list instead of going anywhere. The list opens by
// itself when the current page is inside it.
const navigation: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { id: "home", label: "Home", icon: <HomeIcon /> },
      { id: "people", label: "People", icon: <UsersIcon />, badge: "New" },
      {
        id: "reports",
        label: "Reports",
        icon: <ChartIcon />,
        children: [
          { id: "revenue", label: "Revenue" },
          { id: "retention", label: "Retention" },
          { id: "acquisition", label: "Acquisition" },
        ],
      },
      { id: "settings", label: "Settings", icon: <SettingsIcon /> },
    ],
  },
];

export default function DashboardShellWithSubItemsExample() {
  const [current, setCurrent] = useState("retention");
  return (
    <div className="h-[32rem] w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <DashboardShell navigation={navigation} currentId={current} onNavigate={(item) => setCurrent(item.id)} brand="Acme Cloud">
        <DashboardPage title={findNavItem(navigation, current)?.label ?? "Home"} description="The sidebar marks the page you are on, and opens the list that holds it." />
      </DashboardShell>
    </div>
  );
}
