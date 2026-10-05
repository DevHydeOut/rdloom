import { useCallback, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid, type DataGridQuery } from "@rdloom/react";

interface Order {
  id: string;
  customer: string;
  status: string;
  total: number;
}

const customers = ["Acme", "Globex", "Initech", "Umbrella", "Hooli", "Stark", "Wayne"];
const statuses = ["Open", "Paid", "Shipped", "Refunded"];
const everyOrder: Order[] = Array.from({ length: 50_000 }, (_, i) => ({
  id: `o${i + 1}`,
  customer: customers[(i * 5) % customers.length],
  status: statuses[(i * 3) % statuses.length],
  total: 10 + ((i * 37) % 990) + 0.25,
}));

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

// Stands in for your API: filters, sorts and cuts a page, after a delay.
async function fetchOrders(query: DataGridQuery) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  let rows = everyOrder;
  for (const { id, value } of query.filters) {
    // A "set" filter sends the ticked values as an array; text and select filters send a string.
    rows = rows.filter((row) => {
      const cell = String(row[id as keyof Order]);
      return Array.isArray(value) ? value.includes(cell) : cell.toLowerCase().includes(value.toLowerCase());
    });
  }
  if (query.sorting.length) {
    const [{ id, desc }] = query.sorting;
    const key = id as keyof Order;
    rows = [...rows].sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * (desc ? -1 : 1));
  }
  const start = query.pageIndex * query.pageSize;
  return { rows: rows.slice(start, start + query.pageSize), total: rows.length };
}

const columns: ColumnDef<Order, any>[] = [
  { accessorKey: "id", header: "Order", size: 110 },
  { accessorKey: "customer", header: "Customer", size: 160, meta: { filter: "select", filterOptions: customers } },
  { accessorKey: "status", header: "Status", size: 130, meta: { filter: "set", filterOptions: statuses } },
  { accessorKey: "total", header: "Total", size: 120, meta: { align: "end", filter: false, format: money.format } },
];

// The grid reports what the user asked for; you fetch that page and hand it back.
export default function DataGridServerSideExample() {
  const [rows, setRows] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const latest = useRef(0);

  const load = useCallback(async (query: DataGridQuery) => {
    const request = ++latest.current;
    setLoading(true);
    const result = await fetchOrders(query);
    // A slower, older request must not overwrite a newer one.
    if (request !== latest.current) return;
    setRows(result.rows);
    setTotal(result.total);
    setLoading(false);
  }, []);

  return (
    <DataGrid
      label="Orders"
      serverSide
      data={rows}
      rowCount={total}
      isLoading={loading}
      onQueryChange={load}
      columns={columns}
      getRowId={(o) => o.id}
      pageSize={20}
      showColumnFilters
      height={520}
    />
  );
}
