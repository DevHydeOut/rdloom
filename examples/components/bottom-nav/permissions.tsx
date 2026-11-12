import { useState } from "react";
import { BottomNav, HomeIcon, InboxIcon, SettingsIcon, UserIcon, type NavItem } from "@rdloom/react";

// Your app decides what each person may open and passes the answer on each item. Hidden tabs are not drawn;
// a disabled tab stays focusable, goes nowhere and says why. The server must check access again.
const items: NavItem[] = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "inbox", label: "Inbox", icon: <InboxIcon />, permission: { state: "disabled", reason: "Verify your email to read messages" } },
  { id: "admin", label: "Admin", icon: <SettingsIcon />, permission: "hidden" },
  { id: "account", label: "Account", icon: <UserIcon /> },
];

export default function BottomNavPermissionsExample() {
  const [current, setCurrent] = useState("home");
  return (
    <div className="mx-auto flex h-64 w-[22rem] max-w-full flex-col justify-end overflow-hidden rounded-3xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]">
      <BottomNav items={items} currentId={current} onNavigate={(item) => setCurrent(item.id)} />
    </div>
  );
}
