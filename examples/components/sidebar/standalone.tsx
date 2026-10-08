import { useState } from "react";
import { Button, ChartIcon, HomeIcon, InboxIcon, Sidebar, UsersIcon, type NavGroup } from "@rdloom/react";

const navigation: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { id: "home", label: "Home", icon: <HomeIcon /> },
      { id: "customers", label: "Customers", icon: <UsersIcon />, badge: 24 },
      { id: "revenue", label: "Revenue", icon: <ChartIcon /> },
      { id: "inbox", label: "Inbox", icon: <InboxIcon />, badge: 3 },
    ],
  },
];

// The panel on its own, with the Collapse button at the bottom, in a layout of your own. Give the parent a height:
// the sidebar fills it. onCollapsedChange is where you save the choice if you want it remembered.
export default function SidebarStandaloneExample() {
  const [current, setCurrent] = useState("customers");
  return (
    <div className="mx-auto flex h-[34rem] w-fit max-w-full overflow-hidden sm:w-full rounded-xl border border-[var(--rd-color-border-default)]">
      <Sidebar
        navigation={navigation}
        currentId={current}
        onNavigate={(item) => setCurrent(item.id)}
        team={{ name: "Loomworks", description: "Enterprise" }}
        onSearch={() => {}}
        footer={
          <div className="flex flex-col gap-2 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] p-3 text-sm">
            <p className="font-medium">Free plan</p>
            <Button size="sm">Upgrade</Button>
          </div>
        }
        user={{ name: "Ada Lovelace", email: "ada@example.com", menu: [{ id: "out", label: "Sign out", onSelect: () => {} }] }}
      />
      <div className="hidden flex-1 bg-[var(--rd-color-surface-subtle)] p-6 sm:block text-sm text-[var(--rd-color-text-muted)]">Your page goes here.</div>
    </div>
  );
}
