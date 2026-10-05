import { ShimmerButton } from "@rdloom/react";

export default function ShimmerButtonVariantsExample() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ShimmerButton>Primary</ShimmerButton>
      <ShimmerButton variant="secondary">Secondary</ShimmerButton>
      <ShimmerButton variant="danger">Danger</ShimmerButton>
      <ShimmerButton size="lg">Large</ShimmerButton>
    </div>
  );
}
