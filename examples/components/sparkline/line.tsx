import { Sparkline } from "@rdloom/react";

// Fixed, repeatable series so the preview never changes between renders.
const noise = (i: number, k: number) => Math.sin(i * 12.9898 + k * 78.233) * 0.5 + Math.sin(i * 4.1 + k) * 0.5;

// Daily revenue in thousands: lower at weekends, on top of slow growth, 60 days.
const revenue = Array.from({ length: 60 }, (_, i) => {
  const weekend = i % 7 === 5 || i % 7 === 6 ? -6 : 0;
  return Math.round((42 + i * 0.35 + weekend + noise(i, 1) * 3) * 10) / 10;
});

// Give it a label when the picture carries information the page doesn't say in words.
export default function SparklineLineExample() {
  const last = revenue[revenue.length - 1];
  const change = Math.round(((last - revenue[0]) / revenue[0]) * 100);
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-[36rem] max-w-full flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-[var(--rd-color-text-muted)]">Daily revenue, last 60 days</span>
          <span className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl font-semibold">${last}K</span>
            <span className="text-sm text-[var(--rd-color-feedback-success)]">+{change}%</span>
          </span>
        </div>
        <Sparkline responsive width={576} height={96} data={revenue} label={`Daily revenue, last 60 days: from ${revenue[0]}K to ${last}K, lower on weekends`} />
      </div>
    </div>
  );
}
