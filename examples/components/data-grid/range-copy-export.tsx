import { useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button, DataGrid, type DataGridApi } from "@rdloom/react";

interface Line {
  id: string;
  item: string;
  region: string;
  units: number;
  price: number;
}

const items = ["Notebook", "Pen set", "Desk lamp", "Monitor stand", "Keyboard"];
const regions = ["North", "South", "East", "West"];
const lines: Line[] = Array.from({ length: 40 }, (_, i) => ({
  id: `l${i + 1}`,
  item: items[i % items.length],
  region: regions[(i * 3) % regions.length],
  units: 5 + ((i * 11) % 60),
  price: 4 + ((i * 7) % 90) + 0.5,
}));

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const columns: ColumnDef<Line, any>[] = [
  { accessorKey: "item", header: "Item", size: 170, meta: { editable: true } },
  { accessorKey: "region", header: "Region", size: 120 },
  { accessorKey: "units", header: "Units", size: 100, meta: { align: "end", editable: true, editor: "number" } },
  { accessorKey: "price", header: "Price", size: 120, meta: { align: "end", editable: true, editor: "number", format: money.format } },
];

// Shift+arrows (or dragging) select a block; Ctrl+C copies it, and Ctrl+V pastes
// spreadsheet text into the editable columns. The buttons export the filtered rows.
export default function DataGridRangeCopyExportExample() {
  const [rows, setRows] = useState(lines);
  const api = useRef<DataGridApi>(null);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onPress={() => api.current?.downloadCsv()}>
          Download CSV
        </Button>
        <Button variant="secondary" size="sm" onPress={() => api.current?.downloadExcel()}>
          Download Excel
        </Button>
      </div>
      <DataGrid
        label="Order lines"
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        height={320}
        showColumnFilters
        apiRef={api}
        // A paste changes many cells: apply them in one update.
        onCellsEdit={(edits) =>
          setRows((all) => {
            const byId = new Map(edits.map((e) => [e.rowId + e.columnId, e]));
            return all.map((r) => {
              let next = r;
              for (const column of ["item", "units", "price"] as const) {
                const edit = byId.get(r.id + column);
                if (edit) next = { ...next, [column]: edit.value };
              }
              return next;
            });
          })
        }
        onCellEdit={(e) => setRows((all) => all.map((r) => (r.id === e.rowId ? { ...r, [e.columnId]: e.value } : r)))}
      />
    </div>
  );
}
