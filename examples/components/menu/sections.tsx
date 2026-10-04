import { Button, Menu, MenuItem, MenuSection, MenuSeparator, MenuTrigger } from "@rdloom/react";

export default function MenuSectionsExample() {
  return (
    <MenuTrigger>
      <Button variant="secondary">Project</Button>
      <Menu>
        <MenuSection title="Share">
          <MenuItem id="invite">Invite people</MenuItem>
          <MenuItem id="copy-link">Copy link</MenuItem>
        </MenuSection>
        <MenuSeparator />
        <MenuSection title="Manage">
          <MenuItem id="rename">Rename</MenuItem>
          <MenuItem id="move">Move to…</MenuItem>
          {/* Destructive: red, and the text says exactly what happens. */}
          <MenuItem id="delete" variant="danger">
            Delete project
          </MenuItem>
        </MenuSection>
      </Menu>
    </MenuTrigger>
  );
}
