import { useState } from "react";
import { AppHeader, CommandItem, CommandPalette, UserMenu } from "@rdloom/react";

// The search button opens your command palette. The Ctrl K hint on it is a hint only; the palette itself listens for the key.
export default function AppHeaderBasicExample() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <AppHeader
        onSearch={() => setOpen(true)}
        userMenu={<UserMenu user={{ name: "Ada Lovelace", email: "ada@example.com" }} onSignOut={async () => {}} />}
      />
      <CommandPalette label="Command palette" isOpen={open} onOpenChange={setOpen}>
        <CommandItem id="new-invoice">New invoice</CommandItem>
        <CommandItem id="open-settings">Open settings</CommandItem>
      </CommandPalette>
      <div className="h-24" />
    </div>
  );
}
