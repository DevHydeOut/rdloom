import { PaymentMethodCard } from "@rdloom/react";

const now = new Date("2026-10-07T00:00:00Z");

// Within 60 days of the end of the expiry month the card says so; after it, it says Expired. Words and an icon, not only color.
export default function PaymentMethodCardExpiringExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-md flex-col gap-4">
        <PaymentMethodCard now={now} method={{ id: "a", brand: "Credit", last4: "1881", expMonth: 11, expYear: 2026 }} onUpdate={() => {}} onRemove={() => {}} />
        <PaymentMethodCard now={now} method={{ id: "b", brand: "Debit", last4: "0005", expMonth: 8, expYear: 2026 }} onUpdate={() => {}} onRemove={() => {}} />
      </div>
    </div>
  );
}
