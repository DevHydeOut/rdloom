import { LightRays } from "@rdloom/react";

export default function LightRaysColored() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-48 w-full max-w-md items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <LightRays color="var(--rd-color-ember-300)" angle={35} duration={20} />
        <div className="relative text-center">
          <p className="text-lg font-medium text-[var(--rd-color-text-default)]">Wide ember rays</p>
          <p className="text-sm text-[var(--rd-color-text-muted)]">A slower, steeper sweep</p>
        </div>
      </div>
    </div>
  );
}
