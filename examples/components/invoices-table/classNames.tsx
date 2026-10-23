import { InvoicesTable, type Invoice } from "@rdloom/react";

const AS_OF = "2026-03-15";
const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

const customers = [
  ["Northgate Foods", "accounts@northgate.example"],
  ["Harbor Mills", "billing@harbormills.example"],
  ["Brightwater Supplies", "finance@brightwater.example"],
  ["Lindqvist Textiles", "ap@lindqvist.example"],
  ["Orchard Row Cafe", "hello@orchardrow.example"],
  ["Kestrel Logistics", "invoices@kestrel.example"],
];
const statuses: Invoice["status"][] = ["paid", "open", "paid", "open", "draft", "paid", "open", "void", "paid", "open"];

// Most are paid or open. Open invoices whose due day has passed are shown as overdue without you saying so.
const makeInvoices = (count: number): Invoice[] =>
  Array.from({ length: count }, (_, i) => {
    const [customer, customerEmail] = customers[i % customers.length];
    const issuedAt = addDays(AS_OF, -(6 + i * 5));
    const dueAt = addDays(issuedAt, 30);
    const status = statuses[i % statuses.length];
    return {
      id: `inv-${1042 - i}`,
      number: `INV-${1042 - i}`,
      customer,
      customerEmail,
      issuedAt,
      dueAt,
      paidAt: status === "paid" ? addDays(dueAt, -4 - (i % 5)) : undefined,
      amount: 240 + ((i * 377) % 2400) + (i % 3) * 0.5,
      status,
    };
  });

const invoices = makeInvoices(10);

// Every part has its own class name, added after the built-in ones. Here: softer totals and a tinted toolbar.
export default function InvoicesTableClassNamesExample() {
  return (
    <div className="mx-auto w-[64rem] max-w-full">
      <InvoicesTable
        invoices={invoices}
        asOf={AS_OF}
        pageSize={6}
        classNames={{
          summary: "rounded-[var(--rd-radius-overlay)] bg-[var(--rd-color-surface-subtle)] p-3",
          stat: "[box-shadow:none]",
          toolbar: "rounded-[var(--rd-radius-control)] bg-[var(--rd-color-surface-subtle)] p-2",
          pagination: "justify-center",
        }}
      />
    </div>
  );
}
