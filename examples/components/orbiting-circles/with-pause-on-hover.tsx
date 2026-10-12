import { OrbitingCircles } from "@rdloom/react";

const labels = ["Docs", "Chat", "Plan", "Ship", "Test"];

export default function OrbitingCirclesWithPauseOnHoverExample() {
  return (
    <div className="flex w-full justify-center py-4">
      <OrbitingCircles radius={115} iconSize={52} pauseOnHover reverse showPaths label="Sample links">
        {labels.map((label) => (
          <a
            key={label}
            href="#"
            className="flex size-[52px] items-center justify-center rounded-full border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] text-xs text-[var(--rd-color-text-default)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
          >
            {label}
          </a>
        ))}
      </OrbitingCircles>
    </div>
  );
}
