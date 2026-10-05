import { Ripple } from "@rdloom/react";

export default function RippleWithContentExample() {
  return (
    <Ripple className="h-72 w-[30rem] max-w-full rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]" size={150} rings={5}>
      <div className="text-center">
        <p className="text-xl font-semibold">Join the waitlist</p>
        <p className="pt-1 text-sm text-[var(--rd-color-text-muted)]">Be first to know when it is ready.</p>
      </div>
    </Ripple>
  );
}
