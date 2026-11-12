import { useState } from "react";
import { OrientationGuard, SegmentedControl, SegmentedControlItem } from "@rdloom/react";

// scope="container" covers only the guard's own box, for a part of a page, a preview or a phone frame; give it a height.
// current pretends to hold the phone one way or the other for this demo. The content keeps its state while the message is shown.
export default function OrientationGuardInsideAFrameExample() {
  const [held, setHeld] = useState<"portrait" | "landscape">("landscape");
  return (
    <div className="mx-auto flex w-[22rem] max-w-full flex-col gap-3">
      <SegmentedControl label="How the phone is held" selectedKey={held} onChange={(key) => setHeld(key as "portrait" | "landscape")}>
        <SegmentedControlItem id="portrait">Held upright</SegmentedControlItem>
        <SegmentedControlItem id="landscape">Held sideways</SegmentedControlItem>
      </SegmentedControl>
      <div className="mx-auto h-80 w-[22rem] max-w-full overflow-hidden rounded-3xl border border-[var(--rd-color-border-default)]">
        <OrientationGuard require="portrait" scope="container" current={held} className="h-full">
          <form className="flex flex-col gap-3 p-4" onSubmit={(event) => event.preventDefault()}>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Full name
              <input className="rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-transparent px-3 py-2 text-base font-normal" />
            </label>
            <p className="text-sm text-[var(--rd-color-text-muted)]">What you type here stays when the message comes and goes.</p>
          </form>
        </OrientationGuard>
      </div>
    </div>
  );
}
