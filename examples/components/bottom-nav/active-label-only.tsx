import { useState } from "react";
import { BottomNav, HomeIcon, InboxIcon, SearchIcon, SettingsIcon, UserIcon, type NavItem } from "@rdloom/react";

const items: NavItem[] = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "search", label: "Search", icon: <SearchIcon /> },
  { id: "inbox", label: "Inbox", icon: <InboxIcon /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
  { id: "account", label: "Account", icon: <UserIcon /> },
];

// labels="active" shows only the current tab's label, which suits five tabs in a narrow bar. The others keep their names for screen readers.
export default function BottomNavActiveLabelOnlyExample() {
  const [current, setCurrent] = useState("search");
  return (
    <div className="mx-auto flex h-64 w-[22rem] max-w-full flex-col justify-end overflow-hidden rounded-3xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]">
      <BottomNav items={items} currentId={current} labels="active" onNavigate={(item) => setCurrent(item.id)} />
    </div>
  );
}
