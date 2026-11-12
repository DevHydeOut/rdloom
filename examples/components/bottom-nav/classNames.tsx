import { useState } from "react";
import { BottomNav, HomeIcon, InboxIcon, SearchIcon, UserIcon, type NavItem } from "@rdloom/react";

const items: NavItem[] = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "search", label: "Search", icon: <SearchIcon /> },
  { id: "inbox", label: "Inbox", icon: <InboxIcon />, badge: 4 },
  { id: "account", label: "Account", icon: <UserIcon /> },
];

// Slots: root, list, item, icon, label, badge. Your classes are added after the built-in ones.
export default function BottomNavClassNamesExample() {
  const [current, setCurrent] = useState("home");
  return (
    <div className="mx-auto flex h-64 w-[22rem] max-w-full flex-col justify-end overflow-hidden rounded-3xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]">
      <BottomNav
        items={items}
        currentId={current}
        onNavigate={(item) => setCurrent(item.id)}
        classNames={{ root: "bg-[var(--rd-color-surface-raised)]", label: "uppercase tracking-wide", badge: "bg-[var(--rd-color-text-default)]" }}
      />
    </div>
  );
}
