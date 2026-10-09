import { SelvedgeBlur } from "@rdloom/react";

const tags = ["Design", "Build", "Ship", "Measure", "Learn", "Repeat", "Review", "Plan"];

// start and end follow the reading direction, so this also works in right-to-left layouts.
export default function SelvedgeBlurHorizontalExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative w-80 overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-4">
        <div className="flex w-[34rem] gap-3 text-sm">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-[var(--rd-color-border-default)] px-3 py-1">
              {tag}
            </span>
          ))}
        </div>
        <SelvedgeBlur position="start" size="20%" strength={6} />
        <SelvedgeBlur position="end" size="20%" strength={6} />
      </div>
    </div>
  );
}
