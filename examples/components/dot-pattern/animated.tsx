import { DotPattern } from "@rdloom/react";

export default function DotPatternExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-96 w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <DotPattern animated fade />
        <div className="relative text-center">
          <p className="text-4xl font-semibold tracking-tight text-[var(--rd-color-text-default)]">Slow drift</p>
          <p className="text-base text-[var(--rd-color-text-muted)]">Stops for reduced motion</p>
        </div>
      </div>
    </div>
  );
}
