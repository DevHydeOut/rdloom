import { SpotlightCard } from "@rdloom/react";

export default function SpotlightCardBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <SpotlightCard className="w-full max-w-sm">
        <h3 className="text-base font-medium">Weekly summary</h3>
        <p className="mt-1 text-sm text-[var(--rd-color-text-muted)]">Move the pointer over this card and a soft light follows it.</p>
      </SpotlightCard>
    </div>
  );
}
