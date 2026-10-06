import { Button, DashboardPage } from "@rdloom/react";

export default function DashboardPageBasicExample() {
  return (
    <div className="w-[56rem] max-w-full">
      <DashboardPage
        title="Customers"
        description="Everyone on a plan, with what they pay."
        actions={
          <>
            <Button variant="secondary">Export</Button>
            <Button>Add customer</Button>
          </>
        }
        stats={[
          { label: "Customers", value: 1284, trend: { change: 3.2, label: "vs last month" } },
          { label: "Monthly revenue", value: "$48,200", trend: { change: 12, label: "vs last month" }, data: [31, 34, 33, 38, 41, 44, 48] },
          { label: "Churn", value: "1.8%", trend: { change: -0.4, goodWhen: "down", label: "vs last month" } },
          { label: "Trials", value: 36, description: "9 end this week" },
        ]}
      />
    </div>
  );
}
