import { Sparkline } from "@rdloom/react";

// Fixed, repeatable series so the preview never changes between renders.
const noise = (i: number, k: number) => Math.sin(i * 12.9898 + k * 78.233) * 0.5 + Math.sin(i * 4.1 + k) * 0.5;

// API latency in ms, one point every 20 minutes for a day, with a few spikes.
const latency = Array.from({ length: 72 }, (_, i) => {
  const spike = i === 21 ? 260 : i === 22 ? 140 : i === 51 ? 190 : 0;
  return Math.round(118 + noise(i, 4) * 14 + spike);
});

// The rings mark the slowest and fastest points, and the dashed line shows where "normal" is.
export default function SparklineWithExtremesExample() {
  const hi = Math.max(...latency);
  const lo = Math.min(...latency);
  const avg = Math.round(latency.reduce((n, v) => n + v, 0) / latency.length);
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-[36rem] max-w-full flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-[var(--rd-color-text-muted)]">p95 latency, last 24 hours</span>
          <span className="flex items-baseline gap-2 tabular-nums">
            <span className="text-2xl font-semibold">{avg} ms</span>
            <span className="text-sm text-[var(--rd-color-text-muted)]">avg, peak {hi} ms, low {lo} ms</span>
          </span>
        </div>
        <Sparkline responsive width={576} height={96} data={latency} showExtremes showAverage color="danger" label={`p95 latency over 24 hours: average ${avg} ms, peak ${hi} ms, low ${lo} ms`} />
      </div>
    </div>
  );
}
