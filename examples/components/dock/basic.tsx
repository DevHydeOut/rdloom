import { CalendarIcon, ChartIcon, Dock, DockItem, HomeIcon, InboxIcon, SearchIcon, SettingsIcon } from "@rdloom/react";

// Move the pointer along the dock: the icons grow toward it and their neighbours move aside.
export default function DockBasicExample() {
  return (
    <div className="flex w-full justify-center py-12">
      <Dock label="Applications">
        <DockItem label="Home"><HomeIcon className="size-5" /></DockItem>
        <DockItem label="Search"><SearchIcon className="size-5" /></DockItem>
        <DockItem label="Inbox"><InboxIcon className="size-5" /></DockItem>
        <DockItem label="Calendar"><CalendarIcon className="size-5" /></DockItem>
        <DockItem label="Reports"><ChartIcon className="size-5" /></DockItem>
        <DockItem label="Settings"><SettingsIcon className="size-5" /></DockItem>
      </Dock>
    </div>
  );
}
