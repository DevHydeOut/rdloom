import { PlanCard } from "@rdloom/react";

// Pass the state your data layer is in. Nothing is fetched here.
export default function PlanCardStatesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
        <PlanCard state="loading" />
        <PlanCard state="empty" onChangePlan={() => {}} />
        <PlanCard state="error" onRetry={() => {}} />
      </div>
    </div>
  );
}
