import { Lens } from "@rdloom/react";

// The lens works on any content, not only images. The text below is read once, from the original.
export default function LensWithTextExample() {
  return (
    <div className="flex w-full justify-center">
      <Lens zoom={2.5} size={110} className="rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)]">
        <p className="m-0 max-w-xs p-4 text-xs leading-relaxed text-[var(--rd-color-text-default)]">
          Warranty: this product is covered for twenty four months from the date of purchase. Keep your receipt. Damage from water or drops is not covered. Contact support
          with your order number to start a claim.
        </p>
      </Lens>
    </div>
  );
}
