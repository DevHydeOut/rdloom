import { Chart } from "@rdloom/react";

export default function ChartDonutExample() {
  return (
    <div className="w-[26rem] max-w-full">
      <Chart
        type="donut"
        title="Traffic by source"
        data={{
          labels: ["Search", "Direct", "Referral", "Social"],
          series: [{ name: "Visits", values: [5200, 3100, 1400, 900] }],
        }}
      />
    </div>
  );
}
