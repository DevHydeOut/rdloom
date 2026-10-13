import { StripedPattern } from "@rdloom/react";

export default function StripedPatternExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-96 w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <StripedPattern size={3} gap={14} angle={-45} fade />
        <div className="relative text-center">
          <p className="text-4xl font-semibold tracking-tight text-[var(--rd-color-text-default)]">Opposite angle</p>
          <p className="text-base text-[var(--rd-color-text-muted)]">Fading toward the edges</p>
        </div>
      </div>
    </div>
  );
}
