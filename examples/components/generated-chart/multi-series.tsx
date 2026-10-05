import { GeneratedChart } from "@rdloom/react";

// Series differ by marker shape as well as color, and a legend names them.
export default function GeneratedChartMultiSeriesExample() {
  return (
    <div className="w-[36rem] max-w-full">
      <GeneratedChart
        type="line"
        title="Sign-ups by plan"
        data={{
          labels: ["Q1", "Q2", "Q3", "Q4"],
          series: [
            { name: "Free", values: [400, 520, 610, 700] },
            { name: "Pro", values: [120, 190, 260, 380] },
            { name: "Team", values: [30, 45, 80, 140] },
          ],
        }}
      />
    </div>
  );
}
