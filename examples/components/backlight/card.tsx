import { Backlight } from "@rdloom/react";

export default function BacklightCardExample() {
  return (
    <div className="flex w-full justify-center py-10">
      <Backlight colors={["#38bdf8", "#818cf8"]} isStill intensity={0.45}>
        <div className="w-64 rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-5">
          <h3 className="text-base font-medium text-[var(--rd-color-text-default)]">Team plan</h3>
          <p className="mt-1 text-sm text-[var(--rd-color-text-muted)]">Up to ten people, shared projects and a monthly report.</p>
        </div>
      </Backlight>
    </div>
  );
}
