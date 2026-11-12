import { useState } from "react";
import { BottomNav, BellIcon, HomeIcon, InboxIcon, UserIcon, type NavItem } from "@rdloom/react";

const items: NavItem[] = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "inbox", label: "Inbox", icon: <InboxIcon />, badge: 3 },
  { id: "alerts", label: "Alerts", icon: <BellIcon />, badge: "New" },
  { id: "account", label: "Account", icon: <UserIcon /> },
];

// A count or a short word sits on the icon. A screen reader hears it after the label: "Inbox, 3".
export default function BottomNavWithBadgesExample() {
  const [current, setCurrent] = useState("inbox");
  return (
    <div className="mx-auto flex h-64 w-[22rem] max-w-full flex-col justify-end overflow-hidden rounded-3xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]">
      <BottomNav items={items} currentId={current} onNavigate={(item) => setCurrent(item.id)} />
    </div>
  );
}
