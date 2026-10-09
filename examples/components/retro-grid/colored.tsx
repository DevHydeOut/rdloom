import { RetroGrid } from "@rdloom/react";

export default function RetroGridColored() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-48 w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <RetroGrid color="var(--rd-color-ember-500)" angle={70} cellSize={48} />
        <div className="relative text-center">
          <p className="text-lg font-medium text-[var(--rd-color-text-default)]">Ember floor</p>
          <p className="text-sm text-[var(--rd-color-text-muted)]">Steeper and finer</p>
        </div>
      </div>
    </div>
  );
}
