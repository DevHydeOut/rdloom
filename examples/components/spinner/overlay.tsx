import { Spinner } from "@rdloom/react";

export default function SpinnerOverlayExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="relative w-full max-w-sm rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] p-4 text-sm">
        <p className="font-medium">Invoices</p>
        <p className="mt-1 text-[var(--rd-color-text-muted)]">INV-1042, INV-1043, INV-1044</p>
        <p className="mt-1 text-[var(--rd-color-text-muted)]">INV-1045, INV-1046, INV-1047</p>
        <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-[var(--rd-color-surface-default)]/80">
          <Spinner size="lg" label="Loading invoices" />
        </div>
      </div>
    </div>
  );
}
