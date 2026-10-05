import { GeneratedTable } from "@rdloom/react";

const rows = Array.from({ length: 24 }, (_, i) => [`Customer ${String(i + 1).padStart(2, "0")}`, 120 + ((i * 37) % 400), i % 3 === 0 ? "Overdue" : "Paid"]);

// Long results show the first rows with a Show all button, so a reply doesn't become a wall of data.
export default function GeneratedTableLongExample() {
  return (
    <div className="w-[34rem] max-w-full">
      <GeneratedTable title="Invoices" maxRows={6} data={{ columns: ["Customer", "Amount ($)", "Status"], rows }} />
    </div>
  );
}
