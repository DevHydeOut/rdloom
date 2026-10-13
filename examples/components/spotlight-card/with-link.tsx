import { SpotlightCard } from "@rdloom/react";

export default function SpotlightCardWithLinkExample() {
  return (
    <div className="flex w-full justify-center">
      <SpotlightCard className="w-full max-w-sm">
        <h3 className="text-base font-medium">Billing</h3>
        <p className="mt-1 text-sm text-[var(--rd-color-text-muted)]">Update your plan or payment method.</p>
        <a
          href="#billing"
          className="mt-3 inline-block rounded-[var(--rd-radius-control)] text-sm font-medium text-[var(--rd-color-action-primary)] underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
        >
          Open billing
        </a>
      </SpotlightCard>
    </div>
  );
}
