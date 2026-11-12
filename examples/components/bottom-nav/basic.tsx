import { useState } from "react";
import { BottomNav, HomeIcon, InboxIcon, SearchIcon, UserIcon, type NavItem } from "@rdloom/react";

const items: NavItem[] = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "search", label: "Search", icon: <SearchIcon /> },
  { id: "inbox", label: "Inbox", icon: <InboxIcon /> },
  { id: "account", label: "Account", icon: <UserIcon /> },
];

// Items without an href are buttons: onNavigate does the work. The current one has aria-current, a pill behind its icon and a heavier label.
// In your app add fixed to pin the bar to the bottom of the screen; here it sits at the bottom of the frame.
export default function BottomNavBasicExample() {
  const [current, setCurrent] = useState("home");
  return (
    <div className="mx-auto flex h-64 w-[22rem] max-w-full flex-col justify-end overflow-hidden rounded-3xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]">
      <BottomNav items={items} currentId={current} onNavigate={(item) => setCurrent(item.id)} />
    </div>
  );
}
