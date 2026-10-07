import type { ReactNode } from "react";
import { Badge, DataTable, type DataTableColumn } from "@rdloom/react";

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

// Rows and columns in, a working table out: sorting, pages and a count come for free.
export default function DataTableBasicExample() {
  return (
    <Frame>
      <DataTable label="Orders" rows={orders} columns={columns} getRowId={(o) => o.id} pageSize={8} />
    </Frame>
  );
}
