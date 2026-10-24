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

// Each invoice can carry its own currency. Amounts show in that currency, but the totals only add up the table's
// currency and say how many invoices they left out: adding dollars to euros would be a wrong number.
const invoices: Invoice[] = makeInvoices(12).map((invoice, i) => ({ ...invoice, currency: i % 4 === 1 ? "EUR" : i % 4 === 3 ? "GBP" : "USD" }));

export default function InvoicesTableMultiCurrencyExample() {
  return (
    <div className="mx-auto flex w-[64rem] max-w-full flex-col gap-10">
      <InvoicesTable invoices={invoices} asOf={AS_OF} label="Invoices in dollars" currency="USD" pageSize={6} />
      <InvoicesTable invoices={invoices} asOf={AS_OF} label="Invoices in euros" currency="EUR" locale="de-DE" pageSize={6} />
    </div>
  );
}
