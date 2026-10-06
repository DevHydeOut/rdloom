import { Chart } from "@rdloom/react";

export default function ChartStackedExample() {
  return (
    <div className="w-[36rem] max-w-full">
      <Chart
        stacked
        title="Tickets by channel"
        data={{
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          series: [
            { name: "Email", values: [120, 140, 135, 160, 150, 170] },
            { name: "Chat", values: [80, 95, 110, 105, 130, 140] },
            { name: "Phone", values: [40, 35, 30, 38, 25, 22] },
          ],
        }}
      />
    </div>
  );
}
