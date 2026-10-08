import { Spinner } from "@rdloom/react";

export default function SpinnerInlineExample() {
  return (
    <div className="flex w-full justify-center">
      <p className="flex items-center gap-2 text-sm text-[var(--rd-color-text-muted)]">
        <Spinner size="sm" decorative />
        <span>Checking your connection</span>
      </p>
    </div>
  );
}
