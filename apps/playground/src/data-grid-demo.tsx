import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataGrid, Select, SelectItem, TextField } from "@rdloom/react";

interface Order {
  id: string;
  customer: string;
  city: string;
  status: string;
  items: number;
  total: number;
  placed: string;
}

const customers = ["Ada Lovelace", "Grace Hopper", "Linus Torvalds", "Margaret Hamilton", "Alan Turing", "Katherine Johnson", "Tim Berners-Lee", "Barbara Liskov"];
const cities = ["London", "New York", "Helsinki", "Boston", "Pune", "Tokyo", "Berlin", "São Paulo"];
const statuses = ["Pending", "Paid", "Shipped", "Delivered", "Refunded"];

// Deterministic fake data, so the demo looks the same on every load.
function makeOrders(count: number): Order[] {
  let seed = 42;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: count }, (_, i) => ({
    id: `ORD-${String(i + 1).padStart(6, "0")}`,
    customer: customers[Math.floor(rand() * customers.length)],
    city: cities[Math.floor(rand() * cities.length)],
    status: statuses[Math.floor(rand() * statuses.length)],
    items: 1 + Math.floor(rand() * 12),
    total: Math.round(rand() * 250000) / 100,
    placed: new Date(Date.UTC(2026, 0, 1) + Math.floor(rand() * 270) * 86400000).toISOString().slice(0, 10),
  }));
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const columns: ColumnDef<Order, any>[] = [
  { accessorKey: "id", header: "Order", size: 130 },
  { accessorKey: "customer", header: "Customer", size: 180, meta: { filter: "select" } },
  { accessorKey: "city", header: "City", size: 130, meta: { filter: "select" } },
  { accessorKey: "status", header: "Status", size: 120, meta: { filter: "select" } },
  { accessorKey: "items", header: "Items", size: 90, meta: { align: "end" } },
  { accessorKey: "total", header: "Total", size: 130, meta: { align: "end", filter: false, format: currency.format } },
  { accessorKey: "placed", header: "Placed", size: 130 },
];

const editableColumns: ColumnDef<Order, any>[] = [
  { accessorKey: "id", header: "Order", size: 130 },
  { accessorKey: "customer", header: "Customer", size: 180, meta: { editable: true } },
  { accessorKey: "status", header: "Status", size: 120, meta: { filter: "select" } },
  { accessorKey: "items", header: "Items", size: 90, meta: { align: "end", editable: true, editor: "number" } },
  { accessorKey: "total", header: "Total", size: 130, meta: { align: "end", filter: false, format: currency.format } },
];

/** Small, editable and paginated: edits update local state, like an app would. */
export function EditableGridDemo() {
  const [orders, setOrders] = useState(() => makeOrders(237));
  const [lastEdit, setLastEdit] = useState<string>();
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-sm text-[var(--rd-color-text-muted)]" aria-live="polite">
        Customer and Items are editable: press Enter or F2, or just type. {lastEdit}
      </p>
      <DataGrid
        label="Editable orders"
        data={orders}
        columns={editableColumns}
        getRowId={(o) => o.id}
        density="compact"
        height={300}
        pageSize={10}
        showColumnFilters
        onCellEdit={(e) => {
          setOrders((rows) => rows.map((r) => (r.id === e.rowId ? { ...r, [e.columnId]: e.value } : r)));
          setLastEdit(`Saved ${e.columnId} of ${e.rowId} as "${e.value}".`);
        }}
      />
    </div>
  );
}

// ?rows=1000000 loads that many rows, for `npm run bench:grid`.
const rowsParam = Number(new URLSearchParams(typeof location === "undefined" ? "" : location.search).get("rows"));
const ROW_COUNT = Number.isInteger(rowsParam) && rowsParam > 0 && rowsParam <= 5_000_000 ? rowsParam : 100_000;

export function DataGridDemo() {
  const orders = useMemo(() => makeOrders(ROW_COUNT), []);
  const [filter, setFilter] = useState("");
  const [density, setDensity] = useState<"compact" | "standard" | "comfortable">("standard");
  const [selected, setSelected] = useState<string[]>([]);
  const [opened, setOpened] = useState<string>();

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <TextField className="w-64" label={`Search ${ROW_COUNT.toLocaleString("en-US")} orders`} value={filter} onChange={setFilter} placeholder="e.g. Tokyo or Refunded" />
        <Select
          className="w-44"
          label="Density"
          selectedKey={density}
          onSelectionChange={(k) => setDensity(k as typeof density)}
        >
          <SelectItem id="compact">Compact</SelectItem>
          <SelectItem id="standard">Standard</SelectItem>
          <SelectItem id="comfortable">Comfortable</SelectItem>
        </Select>
        <p className="pb-2 text-sm text-[var(--rd-color-text-muted)]" aria-live="polite">
          {selected.length} selected{opened ? ` · opened ${opened}` : ""}
        </p>
      </div>
      <DataGrid
        label="Orders"
        data={orders}
        columns={columns}
        getRowId={(o) => o.id}
        density={density}
        height={420}
        selectionMode="multiple"
        onSelectionChange={setSelected}
        globalFilter={filter}
        pinnedColumns={["id"]}
        showColumnFilters
        onRowAction={(o) => setOpened(o.id)}
        defaultSorting={[{ id: "placed", desc: true }]}
      />
    </div>
  );
}

// ?server=1000000: the same orders, but held "on a server" that answers at once
// with one page. Used by `npm run bench:grid` to time the grid alone.
const serverParam = Number(new URLSearchParams(typeof location === "undefined" ? "" : location.search).get("server"));
export const SERVER_ROWS = Number.isInteger(serverParam) && serverParam > 0 ? serverParam : 0;

/** Row i, computed from its index alone, so a "server" needs no 1M-row array. */
function orderAt(i: number): Order {
  const hash = (n: number) => {
    let x = (i + 1) * 2654435761 + n * 40503;
    x = Math.imul(x ^ (x >>> 15), 2246822507);
    x = Math.imul(x ^ (x >>> 13), 3266489909);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  };
  return {
    id: `ORD-${String(i + 1).padStart(6, "0")}`,
    customer: customers[Math.floor(hash(1) * customers.length)],
    city: cities[Math.floor(hash(2) * cities.length)],
    status: statuses[Math.floor(hash(3) * statuses.length)],
    items: 1 + Math.floor(hash(4) * 12),
    total: Math.round(hash(5) * 250000) / 100,
    placed: new Date(Date.UTC(2026, 0, 1) + Math.floor(hash(6) * 270) * 86400000).toISOString().slice(0, 10),
  };
}

export function ServerGridDemo() {
  const [state, setState] = useState<{ rows: Order[]; loading: boolean }>({ rows: [], loading: true });
  return (
    <DataGrid
      label="Server orders"
      serverSide
      data={state.rows}
      rowCount={SERVER_ROWS}
      isLoading={state.loading}
      columns={columns}
      getRowId={(o) => o.id}
      pageSize={25}
      height={420}
      showColumnFilters
      onQueryChange={(q) => {
        const desc = q.sorting[0]?.desc ?? false;
        const start = q.pageIndex * q.pageSize;
        const all = Array.from({ length: Math.max(0, Math.min(q.pageSize, SERVER_ROWS - start)) }, (_, i) => orderAt(start + i));
        setState({ rows: desc ? [...all].reverse() : all, loading: false });
      }}
    />
  );
}
