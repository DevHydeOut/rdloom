import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@rdloom/react";

interface Week {
  id: string;
  week: string;
  starts: string;
  visits: number;
  note: string;
}

const weeks: Week[] = [
  { id: "w1", week: "Week 1", starts: "2026-01-05", visits: 120, note: "Launch" },
  { id: "w2", week: "Week 2", starts: "2026-01-12", visits: 150, note: "" },
  ...Array.from({ length: 10 }, (_, i) => ({ id: `w${i + 3}`, week: "", starts: "", visits: 0, note: "" })),
];

const columns: ColumnDef<Week, any>[] = [
  { accessorKey: "week", header: "Week", size: 130, meta: { editable: true } },
  { accessorKey: "starts", header: "Starts", size: 140, meta: { editable: true } },
  { accessorKey: "visits", header: "Visits", size: 110, meta: { align: "end", editable: true, editor: "number" } },
  { accessorKey: "note", header: "Note", size: 160, meta: { editable: true } },
];

// Select the first two rows and drag the handle on the corner of the selection
// down: "Week 1, Week 2" continues as Week 3, Week 4..., the dates step by a week
// and the visits by 30. Ctrl+D copies the top row of a selection down instead.
export default function DataGridFillExample() {
  const [rows, setRows] = useState(weeks);
  return (
    <DataGrid
      label="Weekly visits"
      data={rows}
      columns={columns}
      getRowId={(w) => w.id}
      height={360}
      // A fill changes many cells at once: apply them in one update.
      onCellsEdit={(edits) =>
        setRows((all) =>
          all.map((row) => {
            const mine = edits.filter((e) => e.rowId === row.id);
            return mine.length ? { ...row, ...Object.fromEntries(mine.map((e) => [e.columnId, e.value])) } : row;
          }),
        )
      }
      onCellEdit={(e) => setRows((all) => all.map((r) => (r.id === e.rowId ? { ...r, [e.columnId]: e.value } : r)))}
    />
  );
}
