import { Chart } from "@rdloom/react";

export default function ChartLineExample() {
  return (
    <div className="w-[36rem] max-w-full">
      <Chart
        type="line"
        title="Revenue and cost"
        data={{
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          series: [
            { name: "Revenue", values: [21000, 26500, 31000, 29000, 41000, 48000] },
            { name: "Cost", values: [14000, 12000, 15500, 16000, 18000, 19500] },
          ],
          unit: "$",
        }}
      />
    </div>
  );
}
