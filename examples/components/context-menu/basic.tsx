import { useState } from "react";
import { Button, ContextMenu, ContextMenuItem, CopyIcon, FileIcon } from "@rdloom/react";

// The same actions are in the visible "More" menu of a real list; the right click is a shortcut.
export default function ContextMenuBasicExample() {
  const [last, setLast] = useState<string>();

  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <ContextMenu
        label="Actions for report.pdf"
        onAction={(key) => setLast(String(key))}
        className="flex w-72 items-center gap-3 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] px-3 py-2.5 text-sm"
        items={
          <>
            <ContextMenuItem id="open" icon={<FileIcon className="size-4" />}>
              Open
            </ContextMenuItem>
            <ContextMenuItem id="copy" icon={<CopyIcon />}>
              Copy link
            </ContextMenuItem>
            <ContextMenuItem id="rename">Rename</ContextMenuItem>
          </>
        }
      >
        <FileIcon className="size-5" />
        <span className="flex-1">report.pdf</span>
        <Button variant="ghost" size="sm" onPress={() => setLast("open")}>
          Open
        </Button>
      </ContextMenu>
      <p className="text-xs text-[var(--rd-color-text-muted)]">Right click the file, or focus it and press Shift+F10.</p>
      <p className="text-sm" aria-live="polite">
        {last ? `Chose ${last}` : ""}
      </p>
    </div>
  );
}
