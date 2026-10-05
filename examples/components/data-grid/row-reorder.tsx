import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid, reorderRows } from "@rdloom/react";

interface Step {
  id: string;
  step: string;
  owner: string;
}

const initial: Step[] = [
  { id: "s1", step: "Collect requirements", owner: "Ada" },
  { id: "s2", step: "Draw the first design", owner: "Grace" },
  { id: "s3", step: "Review with the team", owner: "Linus" },
  { id: "s4", step: "Build the prototype", owner: "Margaret" },
  { id: "s5", step: "Test with users", owner: "Alan" },
  { id: "s6", step: "Ship it", owner: "Katherine" },
];

const columns: ColumnDef<Step, any>[] = [
  { accessorKey: "step", header: "Step", size: 240 },
  { accessorKey: "owner", header: "Owner", size: 160 },
];

// Drag a row by its handle, or focus it and press Alt+Up / Alt+Down. The grid
// reports the move; you keep the order, here with reorderRows.
export default function DataGridRowReorderExample() {
  const [steps, setSteps] = useState(initial);
  return (
    <DataGrid
      label="Plan"
      data={steps}
      columns={columns}
      getRowId={(s) => s.id}
      height={320}
      rowReorder
      onRowReorder={(move) => setSteps((rows) => reorderRows(rows, move))}
    />
  );
}
