import { Meteors } from "@rdloom/react";

export default function MeteorsBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative h-48 w-full max-w-md overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <Meteors />
        <div className="relative flex h-full items-center justify-center text-sm font-medium">Quiet night</div>
      </div>
    </div>
  );
}
