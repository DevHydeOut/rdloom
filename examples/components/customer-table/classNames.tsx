import { CustomerTable, type Customer } from "@rdloom/react";

const customers: Customer[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com", company: "Analytical Co", plan: "Pro", status: "active", mrr: 99, joinedAt: "2026-01-14" },
  { id: "2", name: "Grace Hopper", email: "grace@example.com", company: "Compiler Labs", plan: "Team", status: "active", mrr: 499, joinedAt: "2026-02-02" },
  { id: "3", name: "Alan Turing", email: "alan@example.com", plan: "Free", status: "trial", mrr: 0, joinedAt: "2026-03-09" },
];

// classNames restyles one part without editing the file: a tinted table header and a different row hover.
export default function CustomerTableClassNamesExample() {
  return (
    <div className="w-[56rem] max-w-full">
      <CustomerTable
        customers={customers}
        insights="none"
        classNames={{
          table: "[&_[role=columnheader]]:bg-[var(--rd-color-surface-selected)] [&_[role=row]]:data-[hovered]:bg-[var(--rd-color-surface-subtle)]",
          toolbar: "rounded-xl bg-[var(--rd-color-surface-subtle)] p-2",
        }}
      />
    </div>
  );
}
