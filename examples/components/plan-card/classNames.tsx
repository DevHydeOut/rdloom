import { PlanCard } from "@rdloom/react";

// Restyle single parts without editing the file.
export default function PlanCardClassNamesExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md">
        <PlanCard
          plan={{ name: "Team plan", price: 49, interval: "month", features: ["Up to 10 seats", "Email support"] }}
          periodEnd="2027-03-03"
          onChangePlan={() => {}}
          classNames={{
            root: "[box-shadow:none] border-2",
            name: "tracking-tight",
            price: "text-[var(--rd-color-action-primary)]",
            actions: "border-dashed",
          }}
        />
      </div>
    </div>
  );
}
