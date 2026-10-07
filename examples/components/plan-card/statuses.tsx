import { PlanCard } from "@rdloom/react";

const plan = { name: "Team plan", price: 49, interval: "month" as const, features: ["Up to 10 seats", "5 GB of storage"] };
const noop = () => {};

// Each status has its own badge word and date line, so the state is never only a color.
export default function PlanCardStatusesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="grid w-full max-w-4xl gap-4 md:grid-cols-2">
        <PlanCard plan={plan} status="active" periodEnd="2027-03-03" onChangePlan={noop} onCancel={noop} />
        <PlanCard plan={plan} status="trialing" periodEnd="2027-02-17" onChangePlan={noop} onCancel={noop} />
        <PlanCard plan={plan} status="past_due" periodEnd="2027-03-03" onChangePlan={noop} onCancel={noop} onUpdatePayment={noop} />
        <PlanCard plan={plan} status="canceled" periodEnd="2027-03-03" onChangePlan={noop} onCancel={noop} />
      </div>
    </div>
  );
}
