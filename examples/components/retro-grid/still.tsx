import { RetroGrid } from "@rdloom/react";

export default function RetroGridStill() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-96 w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <RetroGrid isStill />
        <div className="relative text-center">
          <p className="text-4xl font-semibold tracking-tight text-[var(--rd-color-text-default)]">Held still</p>
          <p className="text-base text-[var(--rd-color-text-muted)]">The floor stops</p>
        </div>
      </div>
    </div>
  );
}
