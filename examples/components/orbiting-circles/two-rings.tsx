import { OrbitingCircles } from "@rdloom/react";

const names = ["A", "B", "C", "D", "E", "F", "G"];

export default function OrbitingCirclesTwoRingsExample() {
  return (
    <div className="flex w-full justify-center py-4">
      <OrbitingCircles
        radius={130}
        rings={2}
        duration={30}
        iconSize={34}
        label="Sample items on two paths"
        center={<span className="text-sm font-medium text-[var(--rd-color-text-default)]">Core</span>}
      >
        {names.map((name) => (
          <span
            key={name}
            className="flex size-[34px] items-center justify-center rounded-full border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] text-sm text-[var(--rd-color-text-default)]"
          >
            {name}
          </span>
        ))}
      </OrbitingCircles>
    </div>
  );
}
