import { useState } from "react";
import { ChartIcon, DashboardPage, DashboardShell, HomeIcon, InboxIcon, UsersIcon, type NavGroup } from "@rdloom/react";

const navigation: NavGroup[] = [
  {
    items: [
      { id: "home", label: "Home", icon: <HomeIcon /> },
      { id: "customers", label: "Customers", icon: <UsersIcon /> },
      { id: "revenue", label: "Revenue", icon: <ChartIcon /> },
      { id: "inbox", label: "Inbox", icon: <InboxIcon />, badge: 3 },
    ],
  },
];

// Folded down to icons, each with its name in a tooltip (and for screen readers). onCollapsedChange is where
// you save the choice if you want it remembered.
export default function DashboardShellCollapsedExample() {
  const [collapsed, setCollapsed] = useState(true);
  const [current, setCurrent] = useState("home");
  return (
    <div className="h-full w-full">
      <DashboardShell navigation={navigation} currentId={current} onNavigate={(item) => setCurrent(item.id)} isCollapsed={collapsed} onCollapsedChange={setCollapsed} brand="Acme Cloud">
        <DashboardPage title="Home" description={collapsed ? "The sidebar is folded. Open it with the button in the top bar." : "The sidebar is open. Fold it with the button in the top bar."} />
      </DashboardShell>
    </div>
  );
}
