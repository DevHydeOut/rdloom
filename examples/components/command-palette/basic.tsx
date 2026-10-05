import { useState } from "react";
import { Button, CommandItem, CommandPalette, Kbd } from "@rdloom/react";

// Ctrl+K (Cmd+K on a Mac) opens and closes it from anywhere on the page.
export default function CommandPaletteBasicExample() {
  const [last, setLast] = useState("");
  return (
    <div className="flex flex-col items-start gap-3 text-sm">
      <p className="flex items-center gap-1.5">
        Press <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> to open the palette.
      </p>
      <CommandPalette label="Command palette" onAction={(key) => setLast(String(key))}>
        <CommandItem id="new-project">New project</CommandItem>
        <CommandItem id="invite">Invite a teammate</CommandItem>
        <CommandItem id="settings">Open settings</CommandItem>
        <CommandItem id="theme" keywords="dark light appearance">
          Switch theme
        </CommandItem>
      </CommandPalette>
      <p aria-live="polite" className="text-[var(--rd-color-text-muted)]">
        {last ? `Ran: ${last}` : "Nothing run yet."}
      </p>
    </div>
  );
}
