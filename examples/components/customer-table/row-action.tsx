import { useState } from "react";
import { Alert, CustomerTable, type Customer } from "@rdloom/react";

const customers: Customer[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com", company: "Analytical Co", plan: "Pro", status: "active", mrr: 99, joinedAt: "2026-01-14" },
  { id: "2", name: "Grace Hopper", email: "grace@example.com", company: "Compiler Labs", plan: "Team", status: "active", mrr: 499, joinedAt: "2026-02-02" },
  { id: "3", name: "Alan Turing", email: "alan@example.com", plan: "Free", status: "trial", mrr: 0, joinedAt: "2026-03-09" },
];

// onOpenCustomer turns each name into a button. What it opens (a panel, a page, a dialog) is up to you.
export default function CustomerTableRowActionExample() {
  const [open, setOpen] = useState<Customer | null>(null);
  return (
    <div className="flex w-[56rem] max-w-full flex-col gap-4">
      {open && (
        <Alert title={open.name} onDismiss={() => setOpen(null)}>
          {open.email}, on the {open.plan} plan.
        </Alert>
      )}
      <CustomerTable customers={customers} insights="none" onOpenCustomer={setOpen} />
    </div>
  );
}
