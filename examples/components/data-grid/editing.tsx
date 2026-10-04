import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@rdloom/react";

interface Person {
  id: string;
  name: string;
  team: string;
  city: string;
  age: number;
}

const teams = ["Design", "Platform", "Growth", "Support"];
const cities = ["Pune", "London", "Tokyo", "Berlin", "Toronto"];
const people: Person[] = Array.from({ length: 60 }, (_, i) => ({
  id: `p${i + 1}`,
  name: `Person ${i + 1}`,
  team: teams[i % teams.length],
  city: cities[(i * 7) % cities.length],
  age: 22 + ((i * 13) % 40),
}));

const columns: ColumnDef<Person, any>[] = [
  { accessorKey: "name", header: "Name", size: 160 },
  { accessorKey: "team", header: "Team", size: 130 },
  { accessorKey: "city", header: "City", size: 130 },
  { accessorKey: "age", header: "Age", size: 90, meta: { align: "end" } },
];

// Enter, F2, double-click or typing starts an edit.
const editColumns: ColumnDef<Person, any>[] = [
  { accessorKey: "name", header: "Name", size: 160, meta: { editable: true } },
  { accessorKey: "team", header: "Team", size: 130 },
  { accessorKey: "age", header: "Age", size: 90, meta: { align: "end", editable: true, editor: "number" } },
];

export default function DataGridEditingExample() {
  const [rows, setRows] = useState(people);
  return (
    <DataGrid
      label="People"
      data={rows}
      columns={editColumns}
      getRowId={(p) => p.id}
      height={320}
      // The grid never changes your data: apply the edit yourself.
      onCellEdit={(e) => setRows((all) => all.map((r) => (r.id === e.rowId ? { ...r, [e.columnId]: e.value } : r)))}
    />
  );
}
