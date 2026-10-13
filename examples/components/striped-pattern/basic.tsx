import { StripedPattern } from "@rdloom/react";

export default function StripedPatternExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-96 w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <StripedPattern fade={false} />
        <div className="relative text-center">
          <p className="text-4xl font-semibold tracking-tight text-[var(--rd-color-text-default)]">Diagonal stripes</p>
          <p className="text-base text-[var(--rd-color-text-muted)]">A calm texture behind content</p>
        </div>
      </div>
    </div>
  );
}
