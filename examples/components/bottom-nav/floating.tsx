import { useState } from "react";
import { BottomNav, HomeIcon, InboxIcon, SearchIcon, UserIcon, type NavItem } from "@rdloom/react";

const items: NavItem[] = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "search", label: "Search", icon: <SearchIcon /> },
  { id: "inbox", label: "Inbox", icon: <InboxIcon />, badge: 2 },
  { id: "account", label: "Account", icon: <UserIcon /> },
];

// A rounded bar with a shadow and a margin around it. It still keeps clear of the home indicator.
export default function BottomNavFloatingExample() {
  const [current, setCurrent] = useState("home");
  return (
    <div className="mx-auto flex h-64 w-[22rem] max-w-full flex-col justify-end overflow-hidden rounded-3xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]">
      <BottomNav items={items} currentId={current} variant="floating" onNavigate={(item) => setCurrent(item.id)} />
    </div>
  );
}
