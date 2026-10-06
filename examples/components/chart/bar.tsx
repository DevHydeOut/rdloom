import { Chart } from "@rdloom/react";

export default function ChartBarExample() {
  return (
    <div className="w-[36rem] max-w-full">
      <Chart
        title="Revenue by month"
        summary="Revenue grew every month except April, reaching $48K in June."
        data={{
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          series: [{ name: "Revenue", values: [21000, 26500, 31000, 29000, 41000, 48000] }],
          unit: "$",
        }}
      />
    </div>
  );
}
