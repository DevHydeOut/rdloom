import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@rdloom/react";

interface Order {
  id: string;
  region: string;
  rep: string;
  product: string;
  amount: number;
}

const regions = ["North", "South", "East", "West"];
const reps = ["Asha", "Ben", "Chen", "Dara", "Eli"];
const products = ["Starter", "Team", "Business"];
const orders: Order[] = Array.from({ length: 80 }, (_, i) => ({
  id: `o${i + 1}`,
  region: regions[i % regions.length],
  rep: reps[(i * 3) % reps.length],
  product: products[(i * 7) % products.length],
  amount: 200 + ((i * 137) % 1800),
}));

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// Group rows total a column only when it sets aggregationFn.
const columns: ColumnDef<Order, any>[] = [
  { accessorKey: "region", header: "Region", size: 170 },
  { accessorKey: "rep", header: "Rep", size: 130 },
  { accessorKey: "product", header: "Product", size: 130 },
  {
    accessorKey: "amount",
    header: "Amount",
    size: 120,
    aggregationFn: "sum",
    meta: { align: "end", format: (v: number) => money.format(v) },
  },
];

export default function DataGridGroupingExample() {
  return (
    <DataGrid label="Orders by region" data={orders} columns={columns} getRowId={(o) => o.id} groupBy={["region"]} height={360} />
  );
}
