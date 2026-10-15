import { SmoothCursor } from "@rdloom/react";

export default function SmoothCursorBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <SmoothCursor className="flex h-48 w-full max-w-md items-center justify-center rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]">
        <p className="text-sm text-[var(--rd-color-text-muted)]">Move the mouse over this area.</p>
      </SmoothCursor>
    </div>
  );
}
