import { useState } from "react";
import { Button, DialogTrigger, HomeIcon, MenuIcon, Sheet, Sidebar, UsersIcon, type NavGroup } from "@rdloom/react";

const navigation: NavGroup[] = [
  {
    items: [
      { id: "home", label: "Home", icon: <HomeIcon /> },
      { id: "customers", label: "Customers", icon: <UsersIcon /> },
    ],
  },
];

// On a phone, put the same Sidebar in a Sheet. onPick closes the sheet after an item is chosen. DashboardShell does
// this for you; use this when you build your own frame.
export default function SidebarInASheetExample() {
  const [current, setCurrent] = useState("home");
  return (
    <DialogTrigger>
      <Button variant="secondary" aria-label="Open navigation">
        <MenuIcon className="size-4" /> Menu
      </Button>
      <Sheet title="Menu" side="start" size="sm">
        {({ close }) => (
          <div className="-m-6 h-[calc(100%+3rem)]">
            <Sidebar navigation={navigation} currentId={current} onNavigate={(item) => setCurrent(item.id)} onPick={close} brand="Acme Cloud" collapsible={false} appearance="subtle" className="[--rd-sidebar-width:100%]" />
          </div>
        )}
      </Sheet>
    </DialogTrigger>
  );
}
