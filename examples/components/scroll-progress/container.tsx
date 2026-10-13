import { useRef } from "react";
import { ScrollProgress } from "@rdloom/react";

export default function ScrollProgressContainer() {
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div className="flex w-full justify-center">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <ScrollProgress target={scroller} label="Panel progress" />
        <div ref={scroller} tabIndex={0} aria-label="Scrollable panel" className="h-48 overflow-y-auto p-4 text-sm text-[var(--rd-color-text-default)]">
          {Array.from({ length: 8 }, (_, i) => (
            <p key={i} className="mb-3 text-[var(--rd-color-text-muted)]">
              Paragraph {i + 1}. Scroll this panel and the bar tracks how much of it you have read. The bar is a progress bar for
              assistive technology, and it updates a few times a second at most.
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
