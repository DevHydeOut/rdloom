import { useState } from "react";
import { Button, Menu, MenuItem, MenuTrigger } from "@rdloom/react";

export default function MenuBasicExample() {
  const [last, setLast] = useState<string>();

  return (
    <div className="flex items-center gap-3">
      <MenuTrigger>
        <Button variant="secondary">Actions</Button>
        <Menu onAction={(key) => setLast(String(key))}>
          <MenuItem id="edit" shortcut="⌘E">
            Edit
          </MenuItem>
          <MenuItem id="duplicate" shortcut="⌘D">
            Duplicate
          </MenuItem>
          <MenuItem id="archive">Archive</MenuItem>
        </Menu>
      </MenuTrigger>
      <p className="text-sm" aria-live="polite">
        {last ? `Chose ${last}` : ""}
      </p>
    </div>
  );
}
