import { Chart } from "@rdloom/react";

export default function ChartLoadingAndEmptyExample() {
  return (
    <div className="flex w-[36rem] max-w-full flex-col gap-6">
      <Chart isLoading title="Revenue by month" height={160} data={{ labels: [], series: [] }} />
      <Chart title="Revenue by month" height={160} data={{ labels: [], series: [] }} emptyMessage="No sales yet this year." />
    </div>
  );
}
