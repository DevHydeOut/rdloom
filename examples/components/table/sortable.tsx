import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, type SortDescriptor } from "@rdloom/react";

const invoices = [
  { id: "inv-1042", customer: "Acme", amount: 1200 },
  { id: "inv-1043", customer: "Globex", amount: 340 },
  { id: "inv-1044", customer: "Initech", amount: 980 },
  { id: "inv-1045", customer: "Hooli", amount: 15 },
];

// The table reports the sort (ascending, descending, then none); you sort your data and pass it back.
export default function TableSortableExample() {
  const [sort, setSort] = useState<SortDescriptor | null>({ column: "amount", direction: "descending" });
  // A third press on a column clears the sort (null): the rows go back to their own order.
  const rows = useMemo(() => {
    if (!sort) return invoices;
    const key = sort.column as "customer" | "amount";
    const sorted = [...invoices].sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0));
    return sort.direction === "descending" ? sorted.reverse() : sorted;
  }, [sort]);
  return (
    <div className="w-[28rem] max-w-full">
      <Table label="Invoices" sortDescriptor={sort} onSortChange={setSort}>
        <TableHeader>
          <TableColumn id="customer" isRowHeader allowsSorting>
            Customer
          </TableColumn>
          <TableColumn id="amount" allowsSorting>
            Amount
          </TableColumn>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} id={r.id}>
              <TableCell>{r.customer}</TableCell>
              <TableCell>${r.amount.toLocaleString("en-US")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
