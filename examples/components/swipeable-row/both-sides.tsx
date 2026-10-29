import { useState } from "react";
import { ArchiveIcon, InboxIcon, SwipeableRow } from "@rdloom/react";

// Actions can sit on both sides: swipe toward the end for Read / unread, toward the start for Archive and Delete.
// The danger tone is for the destructive one. Nothing here depends on the swipe: the actions button reaches them all.
export default function SwipeableRowBothSidesExample() {
  const [log, setLog] = useState("Nothing yet.");
  return (
    <div className="mx-auto w-[22rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <SwipeableRow
        actionsLabel="Actions for the message from Ben Okafor"
        startActions={[{ id: "read", label: "Mark read", icon: <InboxIcon />, tone: "primary", onAction: () => setLog("Marked read") }]}
        endActions={[
          { id: "archive", label: "Archive", icon: <ArchiveIcon />, onAction: () => setLog("Archived") },
          { id: "delete", label: "Delete", tone: "danger", onAction: () => setLog("Deleted") },
        ]}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--rd-color-surface-subtle)] text-sm font-semibold">B</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">Ben Okafor</span>
            <span className="block truncate text-sm text-[var(--rd-color-text-muted)]">Invoice 1042 is attached.</span>
          </span>
        </div>
      </SwipeableRow>
      <p role="status" className="border-t border-[var(--rd-color-border-default)] px-4 py-2 text-xs text-[var(--rd-color-text-muted)]">
        {log}
      </p>
    </div>
  );
}
