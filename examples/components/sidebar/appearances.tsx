import { HomeIcon, InboxIcon, Sidebar, UsersIcon, type NavGroup } from "@rdloom/react";

const navigation: NavGroup[] = [
  {
    items: [
      { id: "home", label: "Home", icon: <HomeIcon /> },
      { id: "customers", label: "Customers", icon: <UsersIcon /> },
      { id: "inbox", label: "Inbox", icon: <InboxIcon />, badge: 3 },
    ],
  },
];

// The same sidebar in its three looks: a line on the inner edge, a tinted panel, and a floating card. The width comes from
// the --rd-sidebar-width variable (16rem by default), so a parent can size it without touching the component.
export default function SidebarAppearancesExample() {
  return (
    <div className="grid h-80 grid-cols-1 gap-4 sm:grid-cols-3">
      {(["bordered", "subtle", "floating"] as const).map((appearance) => (
        <div key={appearance} className="min-w-0 overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
          <Sidebar navigation={navigation} currentId="customers" brand={appearance} appearance={appearance} collapsible={false} label={`${appearance} navigation`} className={appearance === "floating" ? "[--rd-sidebar-width:calc(100%-1rem)]" : "[--rd-sidebar-width:100%]"} />
        </div>
      ))}
    </div>
  );
}
