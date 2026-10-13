import { Particles } from "@rdloom/react";

export default function ParticlesBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative h-96 w-full overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <Particles />
        <div className="relative flex h-full items-center justify-center text-sm font-medium">Move the pointer here</div>
      </div>
    </div>
  );
}
