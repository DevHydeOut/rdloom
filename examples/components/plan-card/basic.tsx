import { PlanCard } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Change plan and Cancel subscription are your callbacks. Cancelling asks first and says when access ends.
export default function PlanCardBasicExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md">
        <PlanCard
          plan={{
            name: "Team plan",
            price: 49,
            interval: "month",
            features: ["Up to 10 seats", "5 GB of storage", "Email support"],
          }}
          periodEnd="2027-03-03"
          usageHint="8 of 10 seats used"
          onChangePlan={() => wait(400)}
          onCancel={() => wait(600)}
        />
      </div>
    </div>
  );
}
