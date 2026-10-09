import { DotPattern } from "@rdloom/react";

export default function DotPatternExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-48 w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <DotPattern fade={false} />
        <div className="relative text-center">
          <p className="text-lg font-medium text-[var(--rd-color-text-default)]">Dot field</p>
          <p className="text-sm text-[var(--rd-color-text-muted)]">Dots every 22 pixels</p>
        </div>
      </div>
    </div>
  );
}
