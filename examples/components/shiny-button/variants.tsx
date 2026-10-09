import { ShinyButton } from "@rdloom/react";

export default function ShinyButtonVariantsExample() {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-4">
      <ShinyButton size="sm">Small</ShinyButton>
      <ShinyButton variant="secondary">Secondary</ShinyButton>
      <ShinyButton variant="ghost" size="lg">Large ghost</ShinyButton>
    </div>
  );
}
