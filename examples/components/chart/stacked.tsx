import { Chart } from "@rdloom/react";

export default function ChartStackedExample() {
  return (
    <div className="w-[40rem] max-w-full">
      <Chart
        stacked
        title="Tickets by channel"
        description="Support tickets opened each month"
        data={{
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
          series: [
            { name: "Email", values: [120, 140, 135, 160, 150, 170, 165, 182] },
            { name: "Chat", values: [80, 95, 110, 105, 130, 140, 152, 148] },
            { name: "Phone", values: [40, 35, 30, 38, 25, 22, 28, 24] },
          ],
        }}
      />
    </div>
  );
}
