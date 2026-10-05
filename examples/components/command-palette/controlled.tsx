import { useState } from "react";
import { Button, CommandItem, CommandPalette } from "@rdloom/react";

// shortcut={null} turns off Ctrl+K: you decide when it opens.
export default function CommandPaletteControlledExample() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-3 text-sm">
      <Button onPress={() => setOpen(true)}>Search everything</Button>
      <span aria-live="polite">{open ? "Open" : "Closed"}</span>
      <CommandPalette label="Search" isOpen={open} onOpenChange={setOpen} shortcut={null}>
        <CommandItem id="a">First command</CommandItem>
        <CommandItem id="b">Second command</CommandItem>
      </CommandPalette>
    </div>
  );
}
