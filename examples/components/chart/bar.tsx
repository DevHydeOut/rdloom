import { Chart } from "@rdloom/react";

export default function ChartBarExample() {
  return (
    <div className="w-[40rem] max-w-full">
      <Chart
        title="Revenue by month"
        description="January to September"
        summary="Revenue grew in most months, reaching $57.5K in September."
        data={{
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
          series: [{ name: "Revenue", values: [21000, 26500, 31000, 29000, 41000, 48000, 46500, 52000, 57500] }],
          unit: "$",
        }}
      />
    </div>
  );
}
