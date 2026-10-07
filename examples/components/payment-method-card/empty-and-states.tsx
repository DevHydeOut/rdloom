import { PaymentMethodCard } from "@rdloom/react";

// No method yet, loading, and a failed load. Your onAdd opens the payment form of your provider.
export default function PaymentMethodCardEmptyAndStatesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-md flex-col gap-4">
        <PaymentMethodCard onAdd={() => {}} />
        <PaymentMethodCard state="loading" />
        <PaymentMethodCard state="error" onRetry={() => {}} />
      </div>
    </div>
  );
}
