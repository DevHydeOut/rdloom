import { CustomerTable, type Customer } from "@rdloom/react";

const customers: Customer[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com", company: "Analytical Co", plan: "Pro", status: "active", mrr: 99, joinedAt: "2026-01-14" },
  { id: "2", name: "Grace Hopper", email: "grace@example.com", company: "Compiler Labs", plan: "Team", status: "active", mrr: 499, joinedAt: "2026-02-02" },
  { id: "3", name: "Alan Turing", email: "alan@example.com", plan: "Free", status: "trial", mrr: 0, joinedAt: "2026-03-09" },
  { id: "4", name: "Margaret Hamilton", email: "margaret@example.com", plan: "Team", status: "overdue", mrr: 499, joinedAt: "2026-03-21" },
  { id: "5", name: "Dennis Ritchie", email: "dennis@example.com", plan: "Pro", status: "churned", mrr: 99, joinedAt: "2025-11-30" },
];

// Just the list: no totals or chart, euros, a British date format, and a custom color for one status.
export default function CustomerTableWithoutInsightsExample() {
  return (
    <div className="mx-auto w-[56rem] max-w-full">
      <CustomerTable customers={customers} insights="none" currency="EUR" locale="en-GB" density="compact" statusTones={{ trial: "warning", overdue: "danger" }} />
    </div>
  );
}
