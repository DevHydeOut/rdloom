import { PaymentMethodCard } from "@rdloom/react";

// Restyle single parts without editing the file.
export default function PaymentMethodCardClassNamesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md">
        <PaymentMethodCard
          method={{ id: "pm3", brand: "Corporate", last4: "7777", expMonth: 3, expYear: 2030, isDefault: true }}
          onUpdate={() => {}}
          classNames={{ root: "[box-shadow:none] border-2", brand: "bg-[var(--rd-color-surface-default)]", number: "tracking-wider", actions: "border-dashed" }}
        />
      </div>
    </div>
  );
}
