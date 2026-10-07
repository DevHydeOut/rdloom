import { useState } from "react";
import { DashboardShell, HomeIcon, UsersIcon, type NavGroup } from "@rdloom/react";

const navigation: NavGroup[] = [
  {
    items: [
      { id: "overview", label: "Overview", icon: <HomeIcon /> },
      { id: "customers", label: "Customers", icon: <UsersIcon />, badge: 24 },
    ],
  },
];

// classNames restyles one part without editing the file: a tinted top bar, a tinted page and a bolder item hover.
export default function DashboardShellClassNamesExample() {
  const [current, setCurrent] = useState("overview");
  return (
    <div className="h-[28rem] w-[56rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <DashboardShell
        navigation={navigation}
        currentId={current}
        brand="Acme"
        header={<span className="text-sm font-semibold">Overview</span>}
        onNavigate={(item) => setCurrent(item.id)}
        classNames={{
          header: "bg-[var(--rd-color-surface-selected)]",
          main: "bg-[var(--rd-color-surface-subtle)]",
          item: "data-[hovered]:bg-[var(--rd-color-surface-selected)]",
        }}
      >
        <p className="p-6 text-sm">Current page: {current}</p>
      </DashboardShell>
    </div>
  );
}
