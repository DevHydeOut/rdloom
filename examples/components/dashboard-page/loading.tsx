import { DashboardPage } from "@rdloom/react";

// While numbers are on their way pass isLoading: they become skeletons and the page is marked busy.
export default function DashboardPageLoadingExample() {
  return (
    <div className="w-[56rem] max-w-full">
      <DashboardPage
        title="Customers"
        isLoading
        stats={[{ label: "Customers", value: 0 }, { label: "Monthly revenue", value: 0 }, { label: "Churn", value: 0 }, { label: "Trials", value: 0 }]}
      />
    </div>
  );
}
