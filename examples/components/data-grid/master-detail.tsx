import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@rdloom/react";

interface Customer {
  id: string;
  name: string;
  plan: string;
  orders: { id: string; date: string; total: number }[];
}

const plans = ["Starter", "Team", "Business"];
const customers: Customer[] = Array.from({ length: 30 }, (_, i) => ({
  id: `c${i + 1}`,
  name: `Customer ${i + 1}`,
  plan: plans[i % plans.length],
  orders: Array.from({ length: 1 + (i % 3) }, (_, j) => ({
    id: `c${i + 1}-o${j + 1}`,
    date: `2026-0${1 + ((i + j) % 9)}-1${j}`,
    total: 120 + ((i * 53 + j * 31) % 900),
  })),
}));

const columns: ColumnDef<Customer, any>[] = [
  { accessorKey: "name", header: "Customer", size: 200 },
  { accessorKey: "plan", header: "Plan", size: 120 },
  { id: "orderCount", accessorFn: (c) => c.orders.length, header: "Orders", size: 100, meta: { align: "end" } },
];

// Expand a row with its toggle, or Right arrow on the first cell.
export default function DataGridMasterDetailExample() {
  return (
    <DataGrid
      label="Customers"
      data={customers}
      columns={columns}
      getRowId={(c) => c.id}
      height={360}
      detailHeight={120}
      renderDetail={(c) => (
        <ul aria-label={`Orders for ${c.name}`} className="grid gap-1 text-sm">
          {c.orders.map((o) => (
            <li key={o.id} className="flex gap-4">
              <span className="w-28 tabular-nums">{o.date}</span>
              <span className="tabular-nums">${o.total}</span>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
