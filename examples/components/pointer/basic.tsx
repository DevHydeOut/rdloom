import { Pointer } from "@rdloom/react";

export default function PointerBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <Pointer name="Maya" className="flex h-48 w-full max-w-md items-center justify-center rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]">
        <p className="text-sm text-[var(--rd-color-text-muted)]">Move the mouse here to see a named pointer.</p>
      </Pointer>
    </div>
  );
}
