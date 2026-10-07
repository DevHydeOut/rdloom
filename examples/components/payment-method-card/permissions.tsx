import { PaymentMethodCard } from "@rdloom/react";

// Update is allowed, Remove is shown but not allowed, Make default is hidden.
// The server must still refuse the request: UI permission is not security.
export default function PaymentMethodCardPermissionsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md">
        <PaymentMethodCard
          method={{ id: "pm2", brand: "Credit", last4: "4242", expMonth: 8, expYear: 2029 }}
          onUpdate={() => {}}
          onRemove={() => {}}
          onMakeDefault={() => {}}
          permissions={{
            remove: { state: "disabled", reason: "A workspace needs one payment method. Add another first." },
            makeDefault: "hidden",
          }}
        />
      </div>
    </div>
  );
}
