import { RetroGrid } from "@rdloom/react";

export default function RetroGridBasic() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-48 w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <RetroGrid />
        <div className="relative text-center">
          <p className="text-lg font-medium text-[var(--rd-color-text-default)]">Perspective floor</p>
          <p className="text-sm text-[var(--rd-color-text-muted)]">Scrolls toward you slowly</p>
        </div>
      </div>
    </div>
  );
}
