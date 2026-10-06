import { Stat } from "@rdloom/react";

export default function StatWithTrendExample() {
  return (
    <div className="flex flex-wrap gap-10">
      <Stat label="Active users" value={12840} trend={{ change: 12, label: "vs last month" }} />
      <Stat label="Churn" value={2.4} unit="%" trend={{ change: 0.6, label: "vs last month", goodWhen: "down" }} />
    </div>
  );
}
