import { useState } from "react";
import { Button, SwipeableRow } from "@rdloom/react";

// Control which side is open with open and onOpenChange, for example to keep only one row open in a list or to open one from code.
export default function SwipeableRowControlledExample() {
  const [open, setOpen] = useState<"start" | "end" | null>(null);
  return (
    <div className="mx-auto flex w-[22rem] max-w-full flex-col gap-3">
      <div className="mx-auto w-[22rem] max-w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
        <SwipeableRow
          open={open}
          onOpenChange={setOpen}
          actionsLabel="Actions for the message from Chen Wei"
          endActions={[
            { id: "snooze", label: "Snooze", onAction: () => {} },
            { id: "archive", label: "Archive", tone: "primary", onAction: () => {} },
          ]}
        >
          <div className="flex items-center gap-3 px-4 py-3">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--rd-color-surface-subtle)] text-sm font-semibold">C</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">Chen Wei</span>
            <span className="block truncate text-sm text-[var(--rd-color-text-muted)]">Lunch tomorrow?</span>
          </span>
        </div>
        </SwipeableRow>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onPress={() => setOpen("end")}>
          Show actions
        </Button>
        <Button size="sm" variant="ghost" onPress={() => setOpen(null)}>
          Close
        </Button>
        <span className="text-xs text-[var(--rd-color-text-muted)]">Open side: {open ?? "none"}</span>
      </div>
    </div>
  );
}
