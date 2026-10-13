import { WeaveGrid } from "@rdloom/react";

export default function WeaveGridFaded() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-96 w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <WeaveGrid size={32} fade={false} />
        <div className="relative text-center">
          <p className="text-4xl font-semibold tracking-tight text-[var(--rd-color-text-default)]">Edge to edge</p>
          <p className="text-base text-[var(--rd-color-text-muted)]">No fade at the sides</p>
        </div>
      </div>
    </div>
  );
}
