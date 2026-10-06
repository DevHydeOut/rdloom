import { useState } from "react";
import { Chart, SegmentedControl, SegmentedControlItem } from "@rdloom/react";

const DAYS = 90;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Deterministic data: two sine waves plus a seeded random walk.
function makeSeries(base: number, swing: number, seed: number) {
  let state = seed;
  const next = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  let walk = 0;
  return Array.from({ length: DAYS }, (_, i) => {
    walk += (next() - 0.5) * swing * 0.6;
    return Math.max(10, Math.round(base + Math.sin(i / 6) * swing + Math.sin(i / 17) * swing * 0.8 + walk));
  });
}

const start = new Date(2024, 3, 1);
const labels = Array.from({ length: DAYS }, (_, i) => {
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
});
const desktop = makeSeries(320, 90, 7);
const mobile = makeSeries(210, 70, 21);

const ranges = { "90": "Last 3 months", "30": "Last 30 days", "7": "Last 7 days" } as const;

export default function ChartAreaExample() {
  const [range, setRange] = useState<keyof typeof ranges>("90");
  const count = Number(range);
  return (
    <div className="w-[44rem] max-w-full rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] p-5">
      <Chart
        type="area"
        title="Visitors"
        description={`Visitors for the ${ranges[range].toLowerCase()}`}
        height={260}
        actions={
          <SegmentedControl label="Time range" selectedKey={range} onChange={(key) => setRange(key as keyof typeof ranges)}>
            <SegmentedControlItem id="90">Last 3 months</SegmentedControlItem>
            <SegmentedControlItem id="30">Last 30 days</SegmentedControlItem>
            <SegmentedControlItem id="7">Last 7 days</SegmentedControlItem>
          </SegmentedControl>
        }
        data={{
          labels: labels.slice(-count),
          series: [
            { name: "Desktop", values: desktop.slice(-count) },
            { name: "Mobile", values: mobile.slice(-count) },
          ],
        }}
      />
    </div>
  );
}
