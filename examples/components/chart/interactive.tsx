import { useState } from "react";
import { Chart } from "@rdloom/react";

// Click a bar, or move with the arrow keys and press Enter.
export default function ChartInteractiveExample() {
  const [picked, setPicked] = useState<string>("Nothing picked yet.");
  return (
    <div className="flex w-[36rem] max-w-full flex-col gap-3">
      <Chart
        title="Signups by month"
        data={{
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          series: [{ name: "Signups", values: [320, 410, 380, 520, 610, 580] }],
        }}
        onSelect={(point) => setPicked(`${point.label}: ${point.series} ${point.value}`)}
      />
      <p role="status" className="text-sm text-[var(--rd-color-text-muted)]">
        {picked}
      </p>
    </div>
  );
}
