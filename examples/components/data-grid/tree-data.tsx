import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@rdloom/react";

interface Item {
  id: string;
  name: string;
  kind: "Folder" | "File";
  size: number;
  children?: Item[];
}

const file = (id: string, name: string, size: number): Item => ({ id, name, kind: "File", size });
const tree: Item[] = [
  {
    id: "src",
    name: "src",
    kind: "Folder",
    size: 58,
    children: [
      {
        id: "src/components",
        name: "components",
        kind: "Folder",
        size: 41,
        children: [file("src/components/button.tsx", "button.tsx", 4), file("src/components/data-grid.tsx", "data-grid.tsx", 37)],
      },
      file("src/index.ts", "index.ts", 2),
      file("src/styles.css", "styles.css", 15),
    ],
  },
  { id: "docs", name: "docs", kind: "Folder", size: 12, children: [file("docs/readme.md", "readme.md", 12)] },
  file("package.json", "package.json", 1),
];

const columns: ColumnDef<Item, any>[] = [
  { accessorKey: "name", header: "Name", size: 240 },
  { accessorKey: "kind", header: "Kind", size: 100 },
  { accessorKey: "size", header: "Size (KB)", size: 110, meta: { align: "end" } },
];

export default function DataGridTreeDataExample() {
  return (
    <DataGrid
      label="Files"
      data={tree}
      columns={columns}
      getRowId={(item) => item.id}
      getSubRows={(item) => item.children}
      defaultExpanded
      height={320}
    />
  );
}
