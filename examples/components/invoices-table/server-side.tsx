import { useEffect, useRef, useState } from "react";
import { InvoicesTable, effectiveStatus, invoiceStatusLabels, type DataTableQuery, type Invoice, type InvoiceSummary } from "@rdloom/react";

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

const everything = makeInvoices(240);
const PAGE = 8;

// A stand-in for your API: it filters, sorts and cuts one page, then answers after a short wait.
// In your app the server does this, and also adds up the totals for ALL the invoices that match, not for one page.
function fetchInvoices(query: DataTableQuery) {
  return new Promise<{ rows: Invoice[]; total: number; summary: InvoiceSummary }>((resolve) => {
    let rows = everything.filter((invoice) => {
      const status = effectiveStatus(invoice, AS_OF);
      const wanted = query.filters.status ?? [];
      const text = query.search.trim().toLowerCase();
      return (wanted.length === 0 || wanted.includes(status)) && (!text || `${invoice.number} ${invoice.customer}`.toLowerCase().includes(text));
    });
    if (query.sort) {
      const { column, direction } = query.sort;
      const key = (invoice: Invoice) => (column === "status" ? invoiceStatusLabels[effectiveStatus(invoice, AS_OF)] : column === "amount" ? invoice.amount : ((invoice as unknown as Record<string, string>)[column] ?? ""));
      rows = [...rows].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0) * (direction === "ascending" ? 1 : -1));
    }
    const outstanding = rows.filter((i) => ["open", "overdue"].includes(effectiveStatus(i, AS_OF)));
    const late = rows.filter((i) => effectiveStatus(i, AS_OF) === "overdue");
    const sum = (list: Invoice[]) => Math.round(list.reduce((total, i) => total + i.amount, 0) * 100) / 100;
    const summary: InvoiceSummary = { outstanding: sum(outstanding), overdue: sum(late), overdueCount: late.length, paidLast30Days: 0, currency: "USD", skipped: 0 };
    setTimeout(() => resolve({ rows: rows.slice((query.page - 1) * PAGE, query.page * PAGE), total: rows.length, summary }), 600);
  });
}

export default function InvoicesTableServerSideExample() {
  const [page, setPage] = useState<{ rows: Invoice[]; total: number; summary?: InvoiceSummary }>({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const last = useRef<DataTableQuery | undefined>(undefined);

  const load = (query: DataTableQuery) => {
    last.current = query;
    setLoading(true);
    setError(undefined);
    fetchInvoices(query)
      .then((result) => last.current === query && setPage(result)) // ignore an answer that arrives late
      .catch(() => setError("The server did not answer."))
      .finally(() => last.current === query && setLoading(false));
  };
  useEffect(() => load({ search: "", filters: {}, sort: null, page: 1 }), []);

  return (
    <div className="mx-auto w-[64rem] max-w-full">
      <InvoicesTable
        invoices={page.rows}
        asOf={AS_OF}
        serverSide
        totalCount={page.total}
        pageSize={PAGE}
        summary={page.summary ?? "none"}
        isLoading={loading}
        error={error}
        onRetry={() => last.current && load(last.current)}
        onQueryChange={load}
      />
    </div>
  );
}
