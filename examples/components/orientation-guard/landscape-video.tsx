import { useState } from "react";
import { OrientationGuard, SegmentedControl, SegmentedControlItem } from "@rdloom/react";

// A video that needs landscape. onBlockedChange tells you when the message appears and goes away, so the video can pause meanwhile.
// current pretends to hold the phone one way or the other for this demo; in your app leave it out and the device decides.
export default function OrientationGuardLandscapeVideoExample() {
  const [held, setHeld] = useState<"portrait" | "landscape">("portrait");
  const [playing, setPlaying] = useState(true);
  return (
    <div className="mx-auto flex w-[22rem] max-w-full flex-col gap-3">
      <SegmentedControl label="How the phone is held" selectedKey={held} onChange={(key) => setHeld(key as "portrait" | "landscape")}>
        <SegmentedControlItem id="portrait">Held upright</SegmentedControlItem>
        <SegmentedControlItem id="landscape">Held sideways</SegmentedControlItem>
      </SegmentedControl>
      <div className="mx-auto h-80 w-[22rem] max-w-full overflow-hidden rounded-3xl border border-[var(--rd-color-border-default)]">
        <OrientationGuard require="landscape" scope="container" current={held} onBlockedChange={(blocked) => setPlaying(!blocked)} className="h-full">
          <div className="flex h-full items-center justify-center bg-[var(--rd-color-surface-subtle)] text-sm">The video is {playing ? "playing" : "paused"}</div>
        </OrientationGuard>
      </div>
    </div>
  );
}
