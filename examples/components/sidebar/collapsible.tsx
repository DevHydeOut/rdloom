import { useState } from "react";
import { ChartIcon, HomeIcon, InboxIcon, Sidebar, UsersIcon, type NavGroup } from "@rdloom/react";

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

// The Collapse button at the bottom folds the sidebar down to icons. Each icon keeps its name in a tooltip and for
// screen readers. onCollapsedChange is where you save the choice if you want it remembered.
export default function SidebarCollapsibleExample() {
  const [current, setCurrent] = useState("home");
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="h-[30rem]">
      <Sidebar navigation={navigation} currentId={current} onNavigate={(item) => setCurrent(item.id)} brand="Acme Cloud" isCollapsed={collapsed} onCollapsedChange={setCollapsed} />
    </div>
  );
}
