import { Badge, Button, DataTable, PageHeader, PaymentMethodCard, PlanCard, SectionHeader, UsageMeterList, type DataTableColumn } from "@rdloom/react";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Invoice = { id: string; number: string; date: string; amount: number; status: "Paid" | "Open" | "Refunded" };

const invoices: Invoice[] = [
  { id: "i6", number: "INV-2041", date: "2027-02-03", amount: 49, status: "Open" },
  { id: "i5", number: "INV-2012", date: "2027-01-03", amount: 49, status: "Paid" },
  { id: "i4", number: "INV-1983", date: "2026-12-03", amount: 49, status: "Paid" },
  { id: "i3", number: "INV-1954", date: "2026-11-03", amount: 49, status: "Paid" },
  { id: "i2", number: "INV-1925", date: "2026-10-03", amount: 19, status: "Refunded" },
  { id: "i1", number: "INV-1896", date: "2026-09-03", amount: 19, status: "Paid" },
];

const tone = { Paid: "success", Open: "info", Refunded: "neutral" } as const;
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const day = (iso: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));

const columns: DataTableColumn<Invoice>[] = [
  { id: "number", header: "Invoice", sortable: true },
  { id: "date", header: "Date", sortable: true, cell: (i) => day(i.date) },
  { id: "amount", header: "Amount", align: "end", sortable: true, cell: (i) => money(i.amount) },
  { id: "status", header: "Status", cell: (i) => <Badge variant={tone[i.status]} size="sm">{i.status}</Badge> },
  {
    id: "download",
    header: "Download",
    align: "end",
    cell: (i) => (
      <Button size="sm" variant="ghost" onPress={() => {}}>
        PDF<span className="sr-only"> for {i.number}</span>
      </Button>
    ),
  },
];

// A billing page from the blocks: the plan, usage, the payment method and the invoices.
export default function BillingPageExample() {
  return (
    <div className="flex w-full justify-center p-4">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <PageHeader title="Billing" description="Your plan, what you use and how you pay." border />
        <div className="grid gap-6 lg:grid-cols-2">
          <PlanCard
            plan={{ name: "Team plan", price: 49, interval: "month", features: ["Up to 10 seats", "5 GB of storage", "Email support"] }}
            periodEnd="2027-03-03"
            onChangePlan={() => wait(400)}
            onCancel={() => wait(600)}
          />
          <div className="flex flex-col gap-4 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-5 [box-shadow:var(--rd-elevation-raised)]">
            <SectionHeader title="Usage" description="Resets on 1 March." size="compact" />
            <UsageMeterList
              label="Usage this period"
              meters={[
                { label: "Seats", value: 8, limit: 10, unit: "seats" },
                { label: "Storage", value: 4.2, limit: 5, unit: "GB", onUpgrade: () => wait(400) },
                { label: "API calls", value: 6200, limit: 10000 },
              ]}
            />
          </div>
        </div>
        <PaymentMethodCard
          method={{ id: "pm1", brand: "Credit", last4: "4242", expMonth: 8, expYear: 2029, holder: "Lena Fischer", isDefault: true }}
          onUpdate={() => wait(400)}
          onRemove={() => wait(400)}
        />
        <div className="flex flex-col gap-3">
          <SectionHeader title="Invoices" headingLevel={2} />
          <DataTable label="Invoices" rows={invoices} columns={columns} getRowId={(i) => i.id} pageSize={5} />
        </div>
      </div>
    </div>
  );
}
