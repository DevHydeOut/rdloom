import { Sparkline } from "@rdloom/react";

// Fixed, repeatable series so the preview never changes between renders.
const noise = (i: number, k: number) => Math.sin(i * 12.9898 + k * 78.233) * 0.5 + Math.sin(i * 4.1 + k) * 0.5;

// Orders per day for 45 days, busier on weekdays.
const orders = Array.from({ length: 45 }, (_, i) => {
  const weekend = i % 7 === 5 || i % 7 === 6;
  return Math.round((weekend ? 38 : 72) + noise(i, 3) * 10);
});

export default function SparklineBarExample() {
  const avg = Math.round(orders.reduce((n, v) => n + v, 0) / orders.length);
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-[36rem] max-w-full flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-[var(--rd-color-text-muted)]">Orders per day, last 45 days</span>
          <span className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl font-semibold">{avg}</span>
            <span className="text-sm text-[var(--rd-color-text-muted)]">orders a day on average</span>
          </span>
        </div>
        <Sparkline type="bar" responsive width={576} height={80} data={orders} label={`Orders per day, last 45 days: about ${avg} on average, fewer at weekends`} />
      </div>
    </div>
  );
}
