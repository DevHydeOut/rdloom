import { StripedPattern } from "@rdloom/react";

export default function StripedPatternExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-48 w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <StripedPattern animated fade />
        <div className="relative text-center">
          <p className="text-lg font-medium text-[var(--rd-color-text-default)]">Slow drift</p>
          <p className="text-sm text-[var(--rd-color-text-muted)]">Moves along the stripes</p>
        </div>
      </div>
    </div>
  );
}
