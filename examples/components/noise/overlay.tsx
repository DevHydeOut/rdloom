import { Noise } from "@rdloom/react";

export default function NoiseOverlay() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-96 w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <Noise opacity={0.18} size={120} />
        <div className="relative text-center">
          <p className="text-4xl font-semibold tracking-tight text-[var(--rd-color-text-default)]">Heavier grain</p>
          <p className="text-base text-[var(--rd-color-text-muted)]">Opacity 0.18 on a flat surface</p>
        </div>
      </div>
    </div>
  );
}
