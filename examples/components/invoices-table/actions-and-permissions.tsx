import { useState } from "react";
import { InvoicesTable, SegmentedControl, SegmentedControlItem, type Invoice, type InvoicesTableProps } from "@rdloom/react";

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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
type Viewer = "accountant" | "support" | "viewer";

// What each kind of person may do. The app decides; the table only receives the answers.
// The server must check every one of these again: what the page shows is not security.
const permissionsFor = (viewer: Viewer): InvoicesTableProps["permissions"] => ({
  download: true,
  remind: viewer === "viewer" ? { state: "disabled", reason: "Only support and accounts can send reminders" } : true,
  markPaid: viewer === "accountant" ? true : viewer === "support" ? { state: "disabled", reason: "Only accounts can record payments" } : "hidden",
  void: viewer === "accountant" ? true : "hidden",
  export: viewer === "viewer" ? { state: "disabled", reason: "Only accounts can export" } : true,
  select: viewer === "viewer" ? "hidden" : true,
});

export default function InvoicesTableActionsExample() {
  const [invoices, setInvoices] = useState(() => makeInvoices(16));
  const [viewer, setViewer] = useState<Viewer>("accountant");
  const change = (id: string, patch: Partial<Invoice>) => setInvoices((all) => all.map((invoice) => (invoice.id === id ? { ...invoice, ...patch } : invoice)));

  return (
    <div className="mx-auto flex w-[64rem] max-w-full flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-[var(--rd-color-text-muted)]">View as</span>
        <SegmentedControl label="View as" size="sm" selectedKey={viewer} onChange={(key) => setViewer(String(key) as Viewer)}>
          <SegmentedControlItem id="accountant">Accounts</SegmentedControlItem>
          <SegmentedControlItem id="support">Support</SegmentedControlItem>
          <SegmentedControlItem id="viewer">Viewer</SegmentedControlItem>
        </SegmentedControl>
      </div>
      <InvoicesTable
        invoices={invoices}
        asOf={AS_OF}
        pageSize={8}
        permissions={permissionsFor(viewer)}
        onDownload={(rows) => console.log(`Download ${rows.map((r) => r.number).join(", ")}`)}
        onSendReminder={(rows) => wait(600).then(() => console.log(`Reminded ${rows.map((r) => r.customer).join(", ")}`))}
        onMarkPaid={(invoice) => wait(600).then(() => change(invoice.id, { status: "paid", paidAt: AS_OF }))}
        onVoid={(invoice) => wait(600).then(() => change(invoice.id, { status: "void" }))}
        onOpenInvoice={() => {}}
      />
    </div>
  );
}
