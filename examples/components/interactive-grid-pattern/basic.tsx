import { InteractiveGridPattern } from "@rdloom/react";

export default function InteractiveGridPatternExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-48 w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <InteractiveGridPattern />
        <div className="relative text-center">
          <p className="text-lg font-medium text-[var(--rd-color-text-default)]">Move the mouse here</p>
          <p className="text-sm text-[var(--rd-color-text-muted)]">Cells light up under a mouse or pen, not on touch</p>
        </div>
      </div>
    </div>
  );
}
