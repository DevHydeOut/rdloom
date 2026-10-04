import { useState } from "react";
import type { Selection } from "react-aria-components";
import { Button, Menu, MenuItem, MenuTrigger } from "@rdloom/react";

export default function MenuSelectableExample() {
  const [columns, setColumns] = useState<Selection>(new Set(["name", "status"]));

  return (
    <div className="flex items-center gap-3">
      <MenuTrigger>
        <Button variant="secondary">Columns</Button>
        {/* Items stay checked; the menu stays open while toggling several. */}
        <Menu selectionMode="multiple" selectedKeys={columns} onSelectionChange={setColumns}>
          <MenuItem id="name">Name</MenuItem>
          <MenuItem id="status">Status</MenuItem>
          <MenuItem id="owner">Owner</MenuItem>
          <MenuItem id="updated">Last updated</MenuItem>
        </Menu>
      </MenuTrigger>
      <p className="text-sm">Showing: {columns === "all" ? "all" : [...columns].join(", ")}</p>
    </div>
  );
}
