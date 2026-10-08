import { Spinner } from "@rdloom/react";

export default function SpinnerSizesExample() {
  return (
    <div className="flex w-full items-center justify-center gap-6">
      <Spinner size="sm" label="Loading, small" />
      <Spinner size="md" label="Loading, medium" />
      <Spinner size="lg" label="Loading, large" />
    </div>
  );
}
