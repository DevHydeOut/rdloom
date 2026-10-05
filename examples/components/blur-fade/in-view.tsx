import { BlurFade } from "@rdloom/react";

// Scroll the box: each card reveals as it comes into view.
export default function BlurFadeInViewExample() {
  return (
    <div className="h-56 w-72 overflow-y-auto rounded-lg border border-[var(--rd-color-border-default)] p-3">
      <div className="flex flex-col gap-3 pb-24">
        {Array.from({ length: 6 }, (_, i) => (
          <BlurFade key={i}>
            <div className="rounded-lg border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] p-4 text-sm">
              Card {i + 1}
            </div>
          </BlurFade>
        ))}
      </div>
    </div>
  );
}
