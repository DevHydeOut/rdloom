import { Dock, DockItem, HomeIcon, InboxIcon, SearchIcon, SettingsIcon } from "@rdloom/react";

export default function DockBasicExample() {
  return (
    <div className="flex w-full justify-center py-6">
      <Dock label="Applications">
        <DockItem label="Home"><HomeIcon className="size-5" /></DockItem>
        <DockItem label="Search"><SearchIcon className="size-5" /></DockItem>
        <DockItem label="Inbox"><InboxIcon className="size-5" /></DockItem>
        <DockItem label="Settings"><SettingsIcon className="size-5" /></DockItem>
      </Dock>
    </div>
  );
}
