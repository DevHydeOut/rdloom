import { Ripple } from "@rdloom/react";

export default function RippleBasicExample() {
  return (
    <Ripple className="h-96 w-full rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
      <p className="text-4xl font-semibold tracking-tight text-[var(--rd-color-text-default)]">Ripple</p>
    </Ripple>
  );
}
