import { PlanPicker, type PlanOption } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const plans: PlanOption[] = [
  { id: "starter", name: "Starter", prices: { month: 19, year: 190 }, features: ["Up to 3 seats", "1 GB of storage"] },
  { id: "team", name: "Team", prices: { month: 49, year: 490 }, badge: "Most popular", features: ["Up to 10 seats", "5 GB of storage", "Email support"] },
  { id: "business", name: "Business", prices: { month: 129, year: 1290 }, features: ["Unlimited seats", "100 GB of storage", "Priority support"] },
];

// Choosing a card changes nothing until the button is pressed; then onSelectPlan runs.
export default function PlanPickerExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-4xl">
        <PlanPicker plans={plans} currentPlanId="team" currentInterval="month" onSelectPlan={() => wait(600)} />
      </div>
    </div>
  );
}
