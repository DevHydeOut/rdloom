import { useState } from "react";
import { Menubar, MenubarGroup, MenubarItem, MenubarMenu, MenubarSeparator } from "@rdloom/react";
import type { Key } from "react-aria-components";

export default function MenubarCheckboxAndRadioExample() {
  const [panels, setPanels] = useState<Set<Key>>(new Set(["toolbar"]));
  const [density, setDensity] = useState<Set<Key>>(new Set(["comfortable"]));
  return (
    <div className="flex min-h-72 w-full flex-col items-center gap-4">
      <Menubar label="Application">
        <MenubarMenu label="View">
          <MenubarGroup title="Show" selectionMode="multiple" selectedKeys={panels} onSelectionChange={setPanels}>
            <MenubarItem id="toolbar">Toolbar</MenubarItem>
            <MenubarItem id="sidebar">Sidebar</MenubarItem>
            <MenubarItem id="status">Status bar</MenubarItem>
          </MenubarGroup>
          <MenubarSeparator />
          <MenubarGroup title="Density" selectionMode="single" selectedKeys={density} onSelectionChange={setDensity}>
            <MenubarItem id="compact">Compact</MenubarItem>
            <MenubarItem id="comfortable">Comfortable</MenubarItem>
            <MenubarItem id="spacious">Spacious</MenubarItem>
          </MenubarGroup>
        </MenubarMenu>
      </Menubar>
      <p className="text-sm text-[var(--rd-color-text-muted)]">
        Showing: {[...panels].join(", ") || "nothing"}. Density: {[...density].join("")}.
      </p>
    </div>
  );
}
