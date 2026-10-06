import { CustomerTable, type Customer, type CustomerInsights } from "@rdloom/react";

const customers: Customer[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com", plan: "Pro", status: "active", mrr: 99, joinedAt: "2026-01-14" },
  { id: "2", name: "Grace Hopper", email: "grace@example.com", plan: "Team", status: "active", mrr: 499, joinedAt: "2026-02-02" },
  { id: "3", name: "Alan Turing", email: "alan@example.com", plan: "Pro", status: "trial", mrr: 0, joinedAt: "2026-03-09" },
  { id: "4", name: "Margaret Hamilton", email: "margaret@example.com", plan: "Team", status: "overdue", mrr: 499, joinedAt: "2026-03-21" },
];

// Your own numbers, with a trend and a small history, and any chart type. The cards use Stat, the chart uses Chart.
const insights: CustomerInsights = {
  stats: [
    { label: "Monthly revenue", value: "$48,200", trend: { change: 12, label: "vs last month" }, data: [31, 34, 33, 38, 41, 44, 48] },
    { label: "New customers", value: 128, trend: { change: -4, label: "vs last month" }, data: [22, 30, 28, 26, 24, 27, 25] },
    { label: "Churn", value: "1.8%", trend: { change: -0.4, label: "vs last month", goodWhen: "down" } },
    { label: "Trials", value: 36, description: "9 end this week" },
  ],
  chart: {
    title: "Revenue, last 7 months",
    type: "area",
    data: { labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"], series: [{ name: "Revenue", values: [31000, 34000, 33000, 38000, 41000, 44000, 48200] }] },
  },
};

export default function CustomerTableCustomInsightsExample() {
  return (
    <div className="w-[60rem] max-w-full">
      <CustomerTable customers={customers} insights={insights} />
    </div>
  );
}
