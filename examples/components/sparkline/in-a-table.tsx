import { Sparkline, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@rdloom/react";

const rows = [
  { id: "a", name: "Ada Lovelace", plan: "Team", usage: [12, 15, 14, 19, 22, 21, 27] },
  { id: "b", name: "Grace Hopper", plan: "Pro", usage: [30, 28, 26, 27, 22, 20, 18] },
  { id: "c", name: "Alan Turing", plan: "Pro", usage: [9, 9, 10, 9, 10, 9, 10] },
];

// A column of small trends. Each row's trend is described in the text beside it, so the graphics stay decoration.
export default function SparklineInATableExample() {
  return (
    <div className="w-[34rem] max-w-full">
      <Table label="Usage by customer">
        <TableHeader>
          <TableColumn isRowHeader>Customer</TableColumn>
          <TableColumn>Plan</TableColumn>
          <TableColumn>Last 7 days</TableColumn>
          <TableColumn>Change</TableColumn>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const change = Math.round(((r.usage[6] - r.usage[0]) / r.usage[0]) * 100);
            return (
              <TableRow key={r.id} id={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.plan}</TableCell>
                <TableCell>
                  <Sparkline type="area" data={r.usage} width={64} height={28} color={change > 5 ? "success" : change < -5 ? "danger" : "muted"} />
                </TableCell>
                <TableCell className="tabular-nums">{change > 0 ? `Up ${change}%` : change < 0 ? `Down ${Math.abs(change)}%` : "No change"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
