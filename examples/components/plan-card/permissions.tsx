import { PlanCard } from "@rdloom/react";

// Both buttons are shown but not allowed: they stay reachable and say why.
// The server must still refuse the request: UI permission is not security.
export default function PlanCardPermissionsExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md">
        <PlanCard
          plan={{ name: "Team plan", price: 49, interval: "month", features: ["Up to 10 seats", "5 GB of storage"] }}
          periodEnd="2027-03-03"
          onChangePlan={() => {}}
          onCancel={() => {}}
          permissions={{
            changePlan: { state: "disabled", reason: "Only the billing owner can change the plan." },
            cancel: { state: "disabled", reason: "Only the billing owner can cancel." },
          }}
        />
      </div>
    </div>
  );
}
