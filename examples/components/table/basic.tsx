import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@rdloom/react";

const people = [
  { id: "ada", name: "Ada Lovelace", role: "Mathematician", city: "London" },
  { id: "grace", name: "Grace Hopper", role: "Rear admiral", city: "New York" },
  { id: "katherine", name: "Katherine Johnson", role: "Mathematician", city: "Hampton" },
];

// isRowHeader marks the column that names each row, so a screen reader can say
// "Grace Hopper, Role, Rear admiral" for a cell.
export default function TableBasicExample() {
  return (
    <div className="w-[34rem] max-w-full">
      <Table label="People">
        <TableHeader>
          <TableColumn isRowHeader>Name</TableColumn>
          <TableColumn>Role</TableColumn>
          <TableColumn>City</TableColumn>
        </TableHeader>
        <TableBody>
          {people.map((p) => (
            <TableRow key={p.id} id={p.id}>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.role}</TableCell>
              <TableCell>{p.city}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
