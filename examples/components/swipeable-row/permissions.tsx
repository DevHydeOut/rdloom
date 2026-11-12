import { SwipeableRow } from "@rdloom/react";

// Your app decides what each person may do and passes the answer on each action. A hidden action is not drawn; a disabled one stays
// focusable, does nothing and says why. The server must check access again.
export default function SwipeableRowPermissionsExample() {
  return (
    <div className="mx-auto w-[22rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <SwipeableRow
        defaultOpen="end"
        actionsLabel="Actions for the message from Eli Novak"
        endActions={[
          { id: "archive", label: "Archive", onAction: () => {} },
          { id: "delete", label: "Delete", tone: "danger", onAction: () => {}, permission: { state: "disabled", reason: "Only admins can delete messages" } },
          { id: "report", label: "Report", onAction: () => {}, permission: "hidden" },
        ]}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--rd-color-surface-subtle)] text-sm font-semibold">E</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">Eli Novak</span>
            <span className="block truncate text-sm text-[var(--rd-color-text-muted)]">Your plan renews on the 1st.</span>
          </span>
        </div>
      </SwipeableRow>
    </div>
  );
}
