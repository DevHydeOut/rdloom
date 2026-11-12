import { useState } from "react";
import { Button, DialogTrigger, Drawer } from "@rdloom/react";

// snap and onSnapChange control which height shows, by index into the sorted snapPoints: open it at a height, follow the person's drags,
// or move it from code. labels translates the keyboard button that changes the height.
export default function DrawerControlledSnapExample() {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState(0);
  return (
    <div className="mx-auto flex w-[22rem] max-w-full flex-col gap-3">
      <div ref={setFrame} className="relative flex h-80 items-start justify-center overflow-hidden rounded-3xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] p-6">
        <DialogTrigger>
          <Button variant="secondary">Order summary</Button>
          <Drawer
            portalContainer={frame}
            snapPoints={[0.4, 0.9]}
            snap={snap}
            onSnapChange={setSnap}
            title="Order summary"
            labels={{ expand: "Show more", collapse: "Show less", expanded: "Showing more", collapsed: "Showing less" }}
          >
            <p className="text-sm text-[var(--rd-color-text-muted)]">Three items, delivered on Friday. Total 84.00 USD.</p>
          </Drawer>
        </DialogTrigger>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onPress={() => setSnap(1)}>
          Open fully next time
        </Button>
        <span className="text-xs text-[var(--rd-color-text-muted)]">Snap point: {snap + 1} of 2</span>
      </div>
    </div>
  );
}
