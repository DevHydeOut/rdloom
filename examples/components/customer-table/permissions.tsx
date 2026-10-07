import { CustomerTable, type Customer } from "@rdloom/react";

const customers: Customer[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com", company: "Analytical Co", plan: "Pro", status: "active", mrr: 99, joinedAt: "2026-01-14" },
  { id: "2", name: "Grace Hopper", email: "grace@example.com", company: "Compiler Labs", plan: "Team", status: "active", mrr: 499, joinedAt: "2026-02-02" },
  { id: "3", name: "Alan Turing", email: "alan@example.com", plan: "Free", status: "trial", mrr: 0, joinedAt: "2026-03-09" },
];

// The app answers per action. Here this person may look but not open a customer, and Export is shown with the reason it is off.
// The server must check both again: what the page shows is not security.
export default function CustomerTablePermissionsExample() {
  return (
    <div className="w-[56rem] max-w-full">
      <CustomerTable
        customers={customers}
        insights="none"
        onSelect={() => {}}
        permissions={{ open: "disabled", export: { state: "disabled", reason: "Only admins can export customers" } }}
      />
    </div>
  );
}
