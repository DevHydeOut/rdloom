import { useState } from "react";
import { HomeIcon, Sidebar, Skeleton, UsersIcon, type NavGroup } from "@rdloom/react";

const navigation: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { id: "overview", label: "Overview", icon: <HomeIcon /> },
      { id: "customers", label: "Customers", icon: <UsersIcon />, badge: 24 },
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

// classNames restyles one part without editing the file: a tinted panel, a stronger group heading and a bolder hover.
export default function SidebarClassNamesExample() {
  const [current, setCurrent] = useState("overview");
  return (
    <div className="flex h-full w-full">
      <Sidebar
        navigation={navigation}
        currentId={current}
        brand="Acme"
        user={{ name: "Ada Lovelace", email: "ada@example.com", menu: [{ id: "out", label: "Sign out", onSelect: () => {} }] }}
        onNavigate={(item) => setCurrent(item.id)}
        classNames={{
          root: "bg-[var(--rd-color-surface-selected)]",
          group: "[&>p]:uppercase [&>p]:tracking-wide",
          item: "data-[hovered]:bg-[var(--rd-color-surface-default)]",
        }}
      />
      <PageSkeleton />
    </div>
  );
}
