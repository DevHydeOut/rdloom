import { StripedPattern } from "@rdloom/react";

export default function StripedPatternExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-48 w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <StripedPattern size={3} gap={14} angle={-45} fade />
        <div className="relative text-center">
          <p className="text-lg font-medium text-[var(--rd-color-text-default)]">Opposite angle</p>
          <p className="text-sm text-[var(--rd-color-text-muted)]">Fading toward the edges</p>
        </div>
      </div>
    </div>
  );
}
