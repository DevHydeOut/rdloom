import { HexagonPattern } from "@rdloom/react";

export default function HexagonPatternExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-48 w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <HexagonPattern size={18} fade />
        <div className="relative text-center">
          <p className="text-lg font-medium text-[var(--rd-color-text-default)]">Smaller cells</p>
          <p className="text-sm text-[var(--rd-color-text-muted)]">Fading toward the edges</p>
        </div>
      </div>
    </div>
  );
}
