import { FlickeringGrid } from "@rdloom/react";

export default function FlickeringGridStill() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-96 w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <FlickeringGrid isStill />
        <div className="relative text-center">
          <p className="text-4xl font-semibold tracking-tight text-[var(--rd-color-text-default)]">Held still</p>
          <p className="text-base text-[var(--rd-color-text-muted)]">One frame, no movement</p>
        </div>
      </div>
    </div>
  );
}
