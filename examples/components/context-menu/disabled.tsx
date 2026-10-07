import { ContextMenu, ContextMenuItem } from "@rdloom/react";

// While the file is locked the menu is off: the area is an ordinary element and the browser menu returns.
export default function ContextMenuDisabledExample() {
  return (
    <div className="flex justify-center p-6">
      <ContextMenu
        isDisabled
        label="Actions for locked.pdf"
        className="w-72 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] px-3 py-2.5 text-sm text-[var(--rd-color-text-muted)]"
        items={<ContextMenuItem id="open">Open</ContextMenuItem>}
      >
        locked.pdf (read only, no menu)
      </ContextMenu>
    </div>
  );
}
