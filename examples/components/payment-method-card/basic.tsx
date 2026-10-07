import { useState } from "react";
import { PaymentMethodCard } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const card = { id: "pm1", brand: "Credit", last4: "4242", expMonth: 8, expYear: 2029, holder: "Lena Fischer", isDefault: true };

// Remove it to see the empty state and where focus goes. Your onRemove would call your server.
export default function PaymentMethodCardBasicExample() {
  const [method, setMethod] = useState<typeof card | undefined>(card);
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md">
        <PaymentMethodCard
          method={method}
          onUpdate={() => wait(400)}
          onMakeDefault={() => wait(400)}
          onRemove={async () => {
            await wait(500);
            setMethod(undefined);
          }}
          onAdd={async () => {
            await wait(400);
            setMethod(card);
          }}
        />
      </div>
    </div>
  );
}
