import { ArchiveIcon, SwipeableRow } from "@rdloom/react";

// Slots: root, content, actions, action, toggle. Your classes are added after the built-in ones.
export default function SwipeableRowClassNamesExample() {
  return (
    <div className="mx-auto w-[22rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <SwipeableRow
        actionsLabel="Actions for the message from Fay Lindqvist"
        endActions={[{ id: "archive", label: "Archive", icon: <ArchiveIcon />, tone: "primary", onAction: () => {} }]}
        classNames={{ root: "rounded-xl", content: "bg-[var(--rd-color-surface-subtle)]", action: "uppercase tracking-wide" }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--rd-color-surface-subtle)] text-sm font-semibold">F</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">Fay Lindqvist</span>
            <span className="block truncate text-sm text-[var(--rd-color-text-muted)]">The new logo files are ready.</span>
          </span>
        </div>
      </SwipeableRow>
    </div>
  );
}
