import { useState } from "react";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@rdloom/react";

const files = [
  { id: "a", name: "report.pdf", size: "1.2 MB" },
  { id: "b", name: "photo.png", size: "840 KB" },
  { id: "c", name: "notes.txt", size: "4 KB" },
];

export default function TableSelectableExample() {
  const [selected, setSelected] = useState<"all" | Set<unknown>>(new Set(["b"]));
  const count = selected === "all" ? files.length : selected.size;
  return (
    <div className="flex w-[28rem] max-w-full flex-col gap-2 text-sm">
      <Table label="Files" selectionMode="multiple" selectedKeys={selected as Set<string>} onSelectionChange={(keys) => setSelected(keys)}>
        <TableHeader>
          <TableColumn isRowHeader>Name</TableColumn>
          <TableColumn>Size</TableColumn>
        </TableHeader>
        <TableBody>
          {files.map((f) => (
            <TableRow key={f.id} id={f.id}>
              <TableCell>{f.name}</TableCell>
              <TableCell>{f.size}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p aria-live="polite">{count} selected</p>
    </div>
  );
}
