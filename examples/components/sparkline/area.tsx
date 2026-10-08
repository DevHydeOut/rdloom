import { Sparkline } from "@rdloom/react";

// Fixed, repeatable series so the preview never changes between renders.
const noise = (i: number, k: number) => Math.sin(i * 12.9898 + k * 78.233) * 0.5 + Math.sin(i * 4.1 + k) * 0.5;

// New signups per day over 90 days, trending up with a launch bump around day 45.
const signups = Array.from({ length: 90 }, (_, i) =>
  Math.max(0, Math.round(120 + i * 2.1 + (i > 45 && i < 55 ? 60 : 0) + noise(i, 2) * 18)),
);

export default function SparklineAreaExample() {
  const total = signups.reduce((n, v) => n + v, 0);
  const lastWeek = signups.slice(-7).reduce((n, v) => n + v, 0);
  const prevWeek = signups.slice(-14, -7).reduce((n, v) => n + v, 0);
  const change = Math.round(((lastWeek - prevWeek) / prevWeek) * 100);
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-[36rem] max-w-full flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-[var(--rd-color-text-muted)]">Signups, last 90 days</span>
          <span className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl font-semibold">{total.toLocaleString("en-US")}</span>
            <span className="text-sm text-[var(--rd-color-feedback-success)]">+{change}% vs previous week</span>
          </span>
        </div>
        <Sparkline type="area" responsive width={576} height={96} data={signups} label={`Signups per day, last 90 days: from ${signups[0]} to ${signups[89]}, with a bump after day 45`} />
      </div>
    </div>
  );
}
