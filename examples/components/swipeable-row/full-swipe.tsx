import { useState } from "react";
import { ArchiveIcon, SwipeableRow } from "@rdloom/react";

// fullSwipe: a long swipe, past most of the row's width, runs the first action and closes the row. Use it only for actions that are
// easy to undo, like archiving; here the app offers Undo. A shorter swipe just shows the actions.
export default function SwipeableRowFullSwipeExample() {
  const [archived, setArchived] = useState(false);
  return (
    <div className="mx-auto w-[22rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      {archived ? (
        <p className="flex items-center justify-between px-4 py-3 text-sm">
          Archived.
          <button type="button" className="font-medium underline" onClick={() => setArchived(false)}>
            Undo
          </button>
        </p>
      ) : (
        <SwipeableRow
          fullSwipe
          actionsLabel="Actions for the message from Dana Park"
          endActions={[{ id: "archive", label: "Archive", icon: <ArchiveIcon />, tone: "primary", onAction: () => setArchived(true) }]}
        >
          <div className="flex items-center gap-3 px-4 py-3">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--rd-color-surface-subtle)] text-sm font-semibold">D</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">Dana Park</span>
            <span className="block truncate text-sm text-[var(--rd-color-text-muted)]">Notes from the call are in the doc.</span>
          </span>
        </div>
        </SwipeableRow>
      )}
    </div>
  );
}
