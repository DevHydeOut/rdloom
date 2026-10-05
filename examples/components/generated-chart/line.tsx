import { GeneratedChart } from "@rdloom/react";

export default function GeneratedChartLineExample() {
  return (
    <div className="w-[36rem] max-w-full">
      <GeneratedChart
        type="line"
        title="Daily active users"
        data={{
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          series: [{ name: "Users", values: [820, 940, 910, 1180, 1320, 640, 590] }],
        }}
      />
    </div>
  );
}
