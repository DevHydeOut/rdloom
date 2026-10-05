import { ShuttleBorder } from "@rdloom/react";

// The wrapper sets nothing but the light: give it your own radius, border and background.
export default function ShuttleBorderBasicExample() {
  return (
    <ShuttleBorder className="w-72 rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-5">
      <h3 className="font-semibold">Pro plan</h3>
      <p className="pt-1 text-sm text-[var(--rd-color-text-muted)]">Unlimited projects, priority support and version history.</p>
    </ShuttleBorder>
  );
}
