import { Pointer } from "@rdloom/react";

export default function PointerOnACanvasExample() {
  return (
    <div className="flex w-full justify-center">
      <Pointer name="Sam" color="#7c3aed" className="h-56 w-full max-w-md rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] p-4">
        <div className="grid h-full grid-cols-3 gap-3">
          {["Ideas", "Draft", "Done"].map((title) => (
            <div key={title} className="rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-2 text-xs font-medium">
              {title}
            </div>
          ))}
        </div>
      </Pointer>
    </div>
  );
}
