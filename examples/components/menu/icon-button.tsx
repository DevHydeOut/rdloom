import { Button, Menu, MenuItem, MenuTrigger } from "@rdloom/react";

export default function MenuIconButtonExample() {
  return (
    <MenuTrigger>
      {/* An icon-only button needs a name: screen readers say "More actions, menu button". */}
      <Button variant="ghost" aria-label="More actions">
        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
          <circle cx="3" cy="8" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="13" cy="8" r="1.5" />
        </svg>
      </Button>
      <Menu placement="bottom end">
        <MenuItem id="profile">Your profile</MenuItem>
        <MenuItem id="settings">Settings</MenuItem>
        <MenuItem id="sign-out">Sign out</MenuItem>
      </Menu>
    </MenuTrigger>
  );
}
