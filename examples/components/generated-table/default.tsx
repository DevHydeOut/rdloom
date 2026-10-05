import { GeneratedTable } from "@rdloom/react";

export default function GeneratedTableExample() {
  return (
    <div className="w-[34rem] max-w-full">
      <GeneratedTable
        title="Sales by region, last month"
        fileName="sales-by-region.csv"
        data={{
          columns: ["Region", "Orders", "Revenue ($)", "Growth (%)"],
          rows: [
            ["Europe", 1240, 412000, 9],
            ["Americas", 1985, 655000, 14],
            ["Asia Pacific", 870, 281500, 21],
            ["Africa", 210, 64300, 4],
          ],
        }}
      />
    </div>
  );
}
