import { useState } from "react";
import { Button, CommandGroup, CommandItem, CommandPalette } from "@rdloom/react";

const FolderIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M2.75 5.5A1.5 1.5 0 0 1 4.25 4h3.4l1.6 1.75h6.5a1.5 1.5 0 0 1 1.5 1.5v6.75a1.5 1.5 0 0 1-1.5 1.5H4.25a1.5 1.5 0 0 1-1.5-1.5V5.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const GearIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Groups give long lists a shape; icons and shortcut hints are optional extras.
export default function CommandPaletteGroupedExample() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="secondary" onPress={() => setOpen(true)}>
        Open commands
      </Button>
      <CommandPalette label="Commands" isOpen={open} onOpenChange={setOpen} shortcut={null} placeholder="Type a command or search…">
        <CommandGroup title="Go to">
          <CommandItem id="projects" icon={<FolderIcon />} shortcut="G P">
            Projects
          </CommandItem>
          <CommandItem id="settings" icon={<GearIcon />} shortcut="G S">
            Settings
          </CommandItem>
        </CommandGroup>
        <CommandGroup title="Actions">
          <CommandItem id="new" shortcut="Ctrl N">
            Create a project
          </CommandItem>
          <CommandItem id="export">Export all data</CommandItem>
        </CommandGroup>
      </CommandPalette>
    </div>
  );
}
