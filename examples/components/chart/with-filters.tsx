import { useState } from "react";
import { Chart, SegmentedControl, SegmentedControlItem } from "@rdloom/react";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const revenue = [21000, 26500, 31000, 29000, 41000, 48000, 46500, 52000, 57500, 55000, 63000, 71000];
const cost = [14000, 12000, 15500, 16000, 18000, 19500, 21000, 22500, 24000, 25500, 27000, 29500];

// The filter lives outside the chart: it just changes the data the chart is given.
export default function ChartWithFiltersExample() {
  const [months_, setMonths] = useState("12");
  const count = Number(months_);
  return (
    <div className="w-[44rem] max-w-full rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] p-5">
      <Chart
        type="line"
        title="Revenue and cost"
        description="Monthly totals for the current year"
        height={260}
        actions={
          <SegmentedControl label="Months shown" size="sm" selectedKey={months_} onChange={(key) => setMonths(String(key))}>
            <SegmentedControlItem id="12">12 months</SegmentedControlItem>
            <SegmentedControlItem id="6">6 months</SegmentedControlItem>
            <SegmentedControlItem id="3">3 months</SegmentedControlItem>
          </SegmentedControl>
        }
        data={{
          labels: months.slice(-count),
          series: [
            { name: "Revenue", values: revenue.slice(-count) },
            { name: "Cost", values: cost.slice(-count) },
          ],
          unit: "$",
        }}
      />
    </div>
  );
}
