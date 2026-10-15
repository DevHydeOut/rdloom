import { SmoothCursor } from "@rdloom/react";

export default function SmoothCursorRingExample() {
  return (
    <div className="flex w-full justify-center">
      <SmoothCursor
        shape="ring"
        size={36}
        smoothing={0.08}
        className="w-full max-w-md rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-6"
      >
        <h3 className="text-base font-medium">Studio plan</h3>
        <p className="mt-1 text-sm text-[var(--rd-color-text-muted)]">A slow ring trails the pointer. Your own pointer stays visible.</p>
        <button
          type="button"
          className="mt-4 rounded-[var(--rd-radius-control)] bg-[var(--rd-color-action-primary)] px-3 py-1.5 text-sm text-[var(--rd-color-action-on-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
        >
          Choose plan
        </button>
      </SmoothCursor>
    </div>
  );
}
