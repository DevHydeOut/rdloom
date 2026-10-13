import { NumberTicker } from "@rdloom/react";

// Scroll the box: the count starts when the number comes into view.
export default function NumberTickerInViewExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="h-40 w-64 overflow-y-auto rounded-lg border border-[var(--rd-color-border-default)] p-3">
        <div className="flex flex-col items-center gap-3 pt-48 pb-8">
          <NumberTicker value={4500} startWhenInView className="text-3xl font-semibold" />
          <span className="text-sm text-[var(--rd-color-text-muted)]">teams on the plan</span>
        </div>
      </div>
    </div>
  );
}
