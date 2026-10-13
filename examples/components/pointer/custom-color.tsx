import { Pointer } from "@rdloom/react";

export default function PointerCustomColorExample() {
  return (
    <div className="flex w-full justify-center">
      <Pointer
        name="Jordan"
        color="#0f766e"
        className="flex h-48 w-full max-w-md items-center justify-center rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]"
      >
        <p className="text-sm text-[var(--rd-color-text-muted)]">A teal pointer labelled Jordan.</p>
      </Pointer>
    </div>
  );
}
