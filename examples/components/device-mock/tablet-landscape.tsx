import { Button, DeviceMock } from "@rdloom/react";

export default function DeviceMockTabletLandscapeExample() {
  return (
    <div className="flex w-full justify-center">
      <DeviceMock device="tablet" orientation="landscape" tone="light" label="Tablet preview" className="max-w-[26rem]">
        <div className="flex size-full flex-col items-center justify-center gap-3 p-4 text-center">
          <h3 className="m-0 text-base font-semibold">Weekly summary</h3>
          <p className="m-0 text-sm text-[var(--rd-color-text-muted)]">The button below is a real, focusable button.</p>
          <Button>View report</Button>
        </div>
      </DeviceMock>
    </div>
  );
}
