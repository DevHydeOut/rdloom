import { useState } from "react";
import { HomeIcon, Sidebar, UsersIcon, type NavGroup } from "@rdloom/react";

const navigation: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { id: "overview", label: "Overview", icon: <HomeIcon /> },
      { id: "customers", label: "Customers", icon: <UsersIcon />, badge: 24 },
    ],
  },
];

// classNames restyles one part without editing the file: a tinted panel, a stronger group heading and a bolder hover.
export default function SidebarClassNamesExample() {
  const [current, setCurrent] = useState("overview");
  return (
    <div className="h-[22rem] w-64">
      <Sidebar
        navigation={navigation}
        currentId={current}
        brand="Acme"
        onNavigate={(item) => setCurrent(item.id)}
        classNames={{
          root: "bg-[var(--rd-color-surface-selected)]",
          group: "[&>p]:uppercase [&>p]:tracking-wide",
          item: "data-[hovered]:bg-[var(--rd-color-surface-default)]",
        }}
      />
    </div>
  );
}
