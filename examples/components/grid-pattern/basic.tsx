import { GridPattern } from "@rdloom/react";

export default function GridPatternExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-96 w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <GridPattern fade={false} />
        <div className="relative text-center">
          <p className="text-4xl font-semibold tracking-tight text-[var(--rd-color-text-default)]">Plain grid</p>
          <p className="text-base text-[var(--rd-color-text-muted)]">Lines at every 32 pixels</p>
        </div>
      </div>
    </div>
  );
}
