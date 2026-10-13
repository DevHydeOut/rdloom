import { Marquee } from "@rdloom/react";

const steps = ["Draft", "Review", "Approve", "Publish", "Archive"];

export default function MarqueeVerticalExample() {
  return (
    <div className="flex w-full justify-center">
      <Marquee direction="vertical" speed={24} className="h-44 w-48">
        {steps.map((step) => (
          <span key={step} className="rounded-lg border border-[var(--rd-color-border-default)] px-4 py-2 text-center text-sm">
            {step}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
