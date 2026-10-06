import { Chart } from "@rdloom/react";

export default function ChartAreaExample() {
  return (
    <div className="w-[36rem] max-w-full">
      <Chart
        type="area"
        stacked
        title="Active users by plan"
        data={{
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          series: [
            { name: "Free", values: [900, 980, 1050, 1100, 1200, 1280] },
            { name: "Team", values: [300, 340, 380, 420, 470, 520] },
          ],
        }}
      />
    </div>
  );
}
