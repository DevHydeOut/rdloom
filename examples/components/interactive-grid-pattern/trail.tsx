import { InteractiveGridPattern } from "@rdloom/react";

export default function InteractiveGridPatternExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-48 w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <InteractiveGridPattern variant="trail" size={32} />
        <div className="relative text-center">
          <p className="text-lg font-medium text-[var(--rd-color-text-default)]">A short fading trail</p>
          <p className="text-sm text-[var(--rd-color-text-muted)]">Cells light up under a mouse or pen, not on touch</p>
        </div>
      </div>
    </div>
  );
}
