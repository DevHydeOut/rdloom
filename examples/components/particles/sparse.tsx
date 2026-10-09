import { Particles } from "@rdloom/react";

export default function ParticlesSparseExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative h-48 w-full max-w-md overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <Particles quantity={24} size={2.5} color="var(--rd-color-action-primary)" />
        <div className="relative flex h-full items-center justify-center text-sm font-medium">A few larger dots</div>
      </div>
    </div>
  );
}
