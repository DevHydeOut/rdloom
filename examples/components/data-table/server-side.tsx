import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Badge, DataTable, applyDataTableQuery, type DataTableColumn, type DataTableQuery } from "@rdloom/react";

type Order = { id: string; number: string; customer: string; status: "Paid" | "Pending" | "Refunded" | "Overdue"; region: string; total: number; placed: string };

const names = ["Northgate Foods", "Harbor Mills", "Brightwater Supplies", "Lindqvist Textiles", "Orchard Row Cafe", "Kestrel Logistics", "Maplewood Dental", "Ironbridge Tools", "Saltmarsh Bakery", "Tidewater Outfitters", "Quarry Lane Books", "Fernhill Nursery"];
const statuses: Order["status"][] = ["Paid", "Pending", "Paid", "Overdue", "Refunded", "Paid"];
const regions = ["North", "South", "East", "West"];
const makeOrders = (count: number): Order[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `o${1042 - i}`,
    number: `#${1042 - i}`,
    customer: names[i % names.length],
    status: statuses[i % statuses.length],
    region: regions[(i * 3) % regions.length],
    total: 240 + ((i * 377) % 2400),
    placed: `2026-${String(9 - (i % 6)).padStart(2, "0")}-${String(3 + ((i * 7) % 24)).padStart(2, "0")}`,
  }));
const orders = makeOrders(24);

const tone = { Paid: "success", Pending: "info", Overdue: "warning", Refunded: "neutral" } as const;
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const day = (iso: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));

const columns: DataTableColumn<Order>[] = [
  { id: "number", header: "Order", sortable: true },
  { id: "customer", header: "Customer", sortable: true },
  { id: "status", header: "Status", sortable: true, cell: (o) => <Badge variant={tone[o.status]} size="sm">{o.status}</Badge> },
  { id: "region", header: "Region", hideOnMobile: true },
  { id: "total", header: "Total", align: "end", sortable: true, cell: (o) => money(o.total) },
  { id: "placed", header: "Placed", sortable: true, cell: (o) => day(o.placed) },
];
const statusFilter = { id: "status", label: "Status", options: ["Paid", "Pending", "Overdue", "Refunded"] };
const regionFilter = { id: "region", label: "Region", options: regions };

const Frame = ({ children }: { children: ReactNode }) => (
  <div className="flex w-full justify-center">
    <div className="w-full max-w-5xl">{children}</div>
  </div>
);

const everything = makeOrders(240);

// A stand-in for your API: it answers after a short wait. In your app, send the query to the server and
// return that page and the number of matches. (applyDataTableQuery is the logic the table uses in memory.)
const fetchOrders = (query: DataTableQuery) =>
  new Promise<{ rows: Order[]; total: number }>((resolve) => {
    const { rows, total } = applyDataTableQuery(everything, columns, query, { pageSize: 8, searchColumns: ["number", "customer"], filters: [statusFilter] });
    setTimeout(() => resolve({ rows, total }), 600);
  });

export default function DataTableServerSideExample() {
  const [page, setPage] = useState<{ rows: Order[]; total: number }>({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const last = useRef<DataTableQuery | undefined>(undefined);

  const load = (query: DataTableQuery) => {
    last.current = query;
    setLoading(true);
    setError(undefined);
    fetchOrders(query)
      .then((result) => last.current === query && setPage(result)) // ignore an answer that arrives late
      .catch(() => setError("The server did not answer."))
      .finally(() => last.current === query && setLoading(false));
  };
  useEffect(() => load({ search: "", filters: {}, sort: null, page: 1 }), []);

  return (
    <Frame>
      <DataTable
        label="Orders"
        rows={page.rows}
        totalCount={page.total}
        columns={columns}
        getRowId={(o) => o.id}
        pageSize={8}
        serverSide
        isLoading={loading}
        error={error}
        onRetry={() => last.current && load(last.current)}
        onQueryChange={load}
        searchable
        filters={[statusFilter]}
        onExport={(rows) => console.log(`Export ${rows.length} orders`)}
      />
    </Frame>
  );
}
