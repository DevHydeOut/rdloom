import { useState } from "react";
import { Button, ChartIcon, HomeIcon, InboxIcon, Sidebar, Skeleton, UsersIcon, type NavGroup } from "@rdloom/react";

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

// The panel on its own, with the Collapse button at the bottom, in a layout of your own. Give the parent a height:
// the sidebar fills it. onCollapsedChange is where you save the choice if you want it remembered.
export default function SidebarStandaloneExample() {
  const [current, setCurrent] = useState("customers");
  return (
    <div className="flex h-full w-full overflow-hidden">
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
      <div className="hidden min-w-0 flex-1 sm:block">
        <PageSkeleton />
      </div>
    </div>
  );
}
