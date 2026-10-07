import { useState } from "react";
import { ChartIcon, CreditCardIcon, HomeIcon, InboxIcon, SettingsIcon, Sidebar, UsersIcon, type NavGroup } from "@rdloom/react";

const navigation: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { id: "overview", label: "Dashboard", icon: <HomeIcon /> },
      { id: "customers", label: "Customers", icon: <UsersIcon />, badge: 24 },
      { id: "revenue", label: "Revenue", icon: <ChartIcon /> },
      { id: "inbox", label: "Inbox", icon: <InboxIcon />, badge: 3 },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "billing", label: "Billing", icon: <CreditCardIcon /> },
      { id: "settings", label: "Settings", icon: <SettingsIcon /> },
    ],
  },
];

// The sidebar fills the height of its parent, so give the parent a height. Items without an href call onNavigate.
export default function SidebarBasicExample() {
  const [current, setCurrent] = useState("customers");
  return (
    <div className="h-[34rem]">
      <Sidebar navigation={navigation} currentId={current} onNavigate={(item) => setCurrent(item.id)} brand="Acme Cloud" collapsible={false} />
    </div>
  );
}
