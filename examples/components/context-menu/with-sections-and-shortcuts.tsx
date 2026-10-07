import { ContextMenu, ContextMenuItem, ContextMenuSection, ContextMenuSeparator, CopyIcon, FileIcon, PinIcon } from "@rdloom/react";

export default function ContextMenuWithSectionsAndShortcutsExample() {
  return (
    <div className="flex justify-center p-6">
      <ContextMenu
        label="Actions for Q3 plan"
        className="flex w-80 flex-col gap-1 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] p-4 text-sm"
        items={
          <>
            <ContextMenuSection title="Open">
              <ContextMenuItem id="open" icon={<FileIcon className="size-4" />} shortcut="Enter">
                Open
              </ContextMenuItem>
              <ContextMenuItem id="copy" icon={<CopyIcon />} shortcut="⌘C">
                Copy link
              </ContextMenuItem>
              <ContextMenuItem id="pin" icon={<PinIcon />}>
                Pin to top
              </ContextMenuItem>
            </ContextMenuSection>
            <ContextMenuSeparator />
            <ContextMenuSection title="Manage">
              <ContextMenuItem id="rename" shortcut="F2">
                Rename
              </ContextMenuItem>
              <ContextMenuItem id="archive" isDisabled>
                Archive (needs approval)
              </ContextMenuItem>
              <ContextMenuItem id="delete" variant="danger" shortcut="⌫">
                Delete plan
              </ContextMenuItem>
            </ContextMenuSection>
          </>
        }
      >
        <p className="font-semibold">Q3 plan</p>
        <p className="text-[var(--rd-color-text-muted)]">Right click, long press, or press Shift+F10 when this card is focused.</p>
      </ContextMenu>
    </div>
  );
}
