import { AnimatedList } from "@rdloom/react";

const steps = ["Payment received", "Invoice sent to Dana", "Stock reserved", "Courier booked"];

export default function AnimatedListBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <AnimatedList className="w-full max-w-sm">
        {steps.map((step) => (
          <div
            key={step}
            className="rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-raised)] px-4 py-3 text-sm text-[var(--rd-color-text-default)]"
          >
            {step}
          </div>
        ))}
      </AnimatedList>
    </div>
  );
}
