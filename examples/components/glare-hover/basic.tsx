import { GlareHover } from "@rdloom/react";

export default function GlareHoverBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <GlareHover
        tabIndex={0}
        className="w-64 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
      >
        <h3 className="text-base font-medium">Pro plan</h3>
        <p className="mt-1 text-sm text-[var(--rd-color-text-muted)]">Hover or focus this card to see the glare.</p>
      </GlareHover>
    </div>
  );
}
