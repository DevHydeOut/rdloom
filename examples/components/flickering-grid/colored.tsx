import { FlickeringGrid } from "@rdloom/react";

export default function FlickeringGridColored() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-48 w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <FlickeringGrid color="var(--rd-color-ember-500)" maxOpacity={0.35} squareSize={6} gridGap={4} />
        <div className="relative text-center">
          <p className="text-lg font-medium text-[var(--rd-color-text-default)]">Ember squares</p>
          <p className="text-sm text-[var(--rd-color-text-muted)]">Larger and a little warmer</p>
        </div>
      </div>
    </div>
  );
}
