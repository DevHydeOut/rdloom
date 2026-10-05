import { RippleButton } from "@rdloom/react";

export default function RippleButtonVariantsExample() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <RippleButton>Primary</RippleButton>
      <RippleButton variant="secondary">Secondary</RippleButton>
      <RippleButton variant="ghost">Ghost</RippleButton>
      <RippleButton duration={1000}>Slow ripple</RippleButton>
    </div>
  );
}
