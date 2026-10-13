import { LightRays } from "@rdloom/react";

export default function LightRaysBasic() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative flex h-96 w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <LightRays />
        <div className="relative text-center">
          <p className="text-4xl font-semibold tracking-tight text-[var(--rd-color-text-default)]">Soft rays</p>
          <p className="text-base text-[var(--rd-color-text-muted)]">Sweep slowly</p>
        </div>
      </div>
    </div>
  );
}
