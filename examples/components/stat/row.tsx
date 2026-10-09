import { Stat } from "@rdloom/react";

export default function StatRowExample() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      <Stat label="Revenue" value={48200} format={(n) => `$${n.toLocaleString("en-US")}`} trend={{ change: 12, label: "vs last month" }} />
      <Stat label="Orders" value={1320} trend={{ change: -3, label: "vs last month" }} />
      <Stat label="Refund rate" value={1.8} unit="%" trend={{ change: 0 }} />
    </div>
  );
}
