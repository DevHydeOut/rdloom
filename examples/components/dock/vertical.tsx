import { CalendarIcon, ChartIcon, Dock, DockItem, UsersIcon } from "@rdloom/react";

export default function DockVerticalExample() {
  return (
    <div className="flex w-full justify-center py-4">
      <Dock label="Workspace tools" orientation="vertical">
        <DockItem label="Calendar"><CalendarIcon className="size-5" /></DockItem>
        <DockItem label="Reports"><ChartIcon className="size-5" /></DockItem>
        <DockItem label="Team"><UsersIcon className="size-5" /></DockItem>
      </Dock>
    </div>
  );
}
