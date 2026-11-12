import { useState } from "react";
import { ArchiveIcon, SwipeableRow } from "@rdloom/react";

// Swipe the row toward the start to show Archive. The "Actions for ..." button does the same for the keyboard and
// screen readers: press Tab to reach it. Over the row, scrolling up and down still works.
export default function SwipeableRowBasicExample() {
  const [archived, setArchived] = useState(false);
  return (
    <div className="mx-auto w-[22rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      {archived ? (
        <p className="px-4 py-6 text-center text-sm text-[var(--rd-color-text-muted)]">Archived.</p>
      ) : (
        <SwipeableRow
          actionsLabel="Actions for the message from Ana Ruiz"
          endActions={[{ id: "archive", label: "Archive", icon: <ArchiveIcon />, onAction: () => setArchived(true) }]}
        >
          <div className="flex items-center gap-3 px-4 py-3">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--rd-color-surface-subtle)] text-sm font-semibold">A</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">Ana Ruiz</span>
            <span className="block truncate text-sm text-[var(--rd-color-text-muted)]">Can we move the review to Thursday?</span>
          </span>
        </div>
        </SwipeableRow>
      )}
    </div>
  );
}
