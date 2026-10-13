import { InteractiveHoverButton } from "@rdloom/react";

export default function InteractiveHoverButtonWithHoverLabelExample() {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-4">
      <InteractiveHoverButton hoverLabel="Read it" variant="secondary" size="lg">
        Read the guide
      </InteractiveHoverButton>
      <InteractiveHoverButton hoverLabel="Open" variant="ghost">
        Open the docs
      </InteractiveHoverButton>
    </div>
  );
}
