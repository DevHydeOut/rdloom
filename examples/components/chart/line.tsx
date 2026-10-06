import { Chart } from "@rdloom/react";

export default function ChartLineExample() {
  return (
    <div className="w-[40rem] max-w-full">
      <Chart
        type="line"
        title="Revenue and cost"
        description="Monthly totals for the year"
        data={{
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          series: [
            { name: "Revenue", values: [21000, 26500, 31000, 29000, 41000, 48000, 46500, 52000, 57500, 55000, 63000, 71000] },
            { name: "Cost", values: [14000, 12000, 15500, 16000, 18000, 19500, 21000, 22500, 24000, 25500, 27000, 29500] },
          ],
          unit: "$",
        }}
      />
    </div>
  );
}
