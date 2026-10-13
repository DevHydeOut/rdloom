import { SelvedgeBlur } from "@rdloom/react";

const items = Array.from({ length: 14 }, (_, i) => `Activity entry ${i + 1}`);

// Blur both ends of a scrolling list. The list stays fully scrollable and clickable underneath.
export default function SelvedgeBlurScrollEdgesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative w-72 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <div tabIndex={0} aria-label="Recent activity" role="region" className="h-48 overflow-auto p-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]">
          <ul className="m-0 flex list-none flex-col gap-3 p-0 text-sm">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <SelvedgeBlur position="top" size="20%" strength={6} />
        <SelvedgeBlur position="bottom" size="20%" strength={6} />
      </div>
    </div>
  );
}
