import { Badge } from "@rdloom/react";

const invoices = [
  { id: "INV-1042", status: "Overdue", variant: "danger" },
  { id: "INV-1043", status: "Paid", variant: "success" },
  { id: "INV-1044", status: "Due soon", variant: "warning" },
] as const;

// The status is written out: the color only helps people who can see it.
export default function BadgeInAListExample() {
  return (
    <ul className="flex w-72 flex-col gap-2 text-sm">
      {invoices.map((invoice) => (
        <li key={invoice.id} className="flex items-center justify-between">
          <span>{invoice.id}</span>
          <Badge variant={invoice.variant}>{invoice.status}</Badge>
        </li>
      ))}
    </ul>
  );
}
