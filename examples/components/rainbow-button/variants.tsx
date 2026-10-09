import { RainbowButton } from "@rdloom/react";

export default function RainbowButtonVariantsExample() {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-4">
      <RainbowButton size="sm">Small</RainbowButton>
      <RainbowButton variant="secondary">Secondary</RainbowButton>
      <RainbowButton variant="ghost" size="lg">Large ghost</RainbowButton>
    </div>
  );
}
