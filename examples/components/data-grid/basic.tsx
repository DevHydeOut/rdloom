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

export default function DataGridBasicExample() {
  return (
    <DataGrid label="People" data={people} columns={columns} getRowId={(p) => p.id} height={320} />
  );
}
