import { DotPattern } from "@rdloom/react";

export default function DotPatternExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-96 w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <DotPattern size={3} gap={17} fade />
        <div className="relative text-center">
          <p className="text-4xl font-semibold tracking-tight text-[var(--rd-color-text-default)]">Faded edges</p>
          <p className="text-base text-[var(--rd-color-text-muted)]">Heavier dots that dissolve outward</p>
        </div>
      </div>
    </div>
  );
}
