import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@rdloom/react";

interface Ticket {
  id: string;
  title: string;
  status: string;
  owner: string;
  priority: number;
}

const statuses = ["Open", "In progress", "Blocked", "Done", "Won't fix"];
const owners = ["Ada", "Grace", "Linus", "Margaret", "Alan", "Katherine"];
const titles = ["Login fails", "Slow search", "Wrong total", "Typo in footer", "Export is empty", "Crash on save"];
const tickets: Ticket[] = Array.from({ length: 48 }, (_, i) => ({
  id: `T-${100 + i}`,
  title: titles[i % titles.length],
  status: statuses[(i * 3) % statuses.length],
  owner: owners[(i * 5) % owners.length],
  priority: 1 + (i % 4),
}));

const columns: ColumnDef<Ticket, any>[] = [
  { accessorKey: "id", header: "Ticket", size: 110, meta: { filter: false } },
  { accessorKey: "title", header: "Title", size: 190 },
  // "set": tick any number of values, like a spreadsheet's filter.
  { accessorKey: "status", header: "Status", size: 150, meta: { filter: "set" } },
  { accessorKey: "owner", header: "Owner", size: 140, meta: { filter: "set" } },
  { accessorKey: "priority", header: "Priority", size: 110, meta: { align: "end", filter: false } },
];

// Each header has a menu (Alt+Down on a header opens it): sort, pin, reset
// width, hide, and show hidden columns again.
export default function DataGridColumnMenuExample() {
  return <DataGrid label="Tickets" data={tickets} columns={columns} getRowId={(t) => t.id} height={360} columnMenu showColumnFilters />;
}
