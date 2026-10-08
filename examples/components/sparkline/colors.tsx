import { Sparkline } from "@rdloom/react";

// Fixed, repeatable series so the preview never changes between renders.
const noise = (i: number, k: number) => Math.sin(i * 12.9898 + k * 78.233) * 0.5 + Math.sin(i * 4.1 + k) * 0.5;

const series = (n: number, base: number, slope: number, amp: number, k: number) =>
  Array.from({ length: n }, (_, i) => Math.round((base + slope * i + noise(i, k) * amp) * 100) / 100);

// Color says "good", "bad" or "just a trend", but the words around it still say so: never rely on color alone.
const rows = [
  { label: "Revenue", value: "$58.2K", change: "+24%", note: "Up", color: "primary" as const, data: series(60, 42, 0.28, 3, 1) },
  { label: "Active users", value: "12,480", change: "+11%", note: "Up", color: "success" as const, data: series(60, 9000, 58, 220, 2) },
  { label: "Churn", value: "2.4%", change: "+0.9 pt", note: "Rising", color: "danger" as const, data: series(60, 1.4, 0.017, 0.12, 3) },
  { label: "Page views", value: "84.1K", change: "0%", note: "Flat", color: "muted" as const, data: series(60, 84, 0, 4, 4) },
];

export default function SparklineColorsExample() {
  return (
    <div className="flex w-full justify-center">
      <ul className="flex w-[36rem] max-w-full flex-col divide-y divide-[var(--rd-color-border-default)] text-sm">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[7rem_1fr_6rem] items-center gap-4 py-3">
            <span className="flex flex-col">
              <span className="font-medium">{r.label}</span>
              <span className="text-xs text-[var(--rd-color-text-muted)]">{r.note}</span>
            </span>
            <Sparkline type="area" color={r.color} responsive width={240} height={40} data={r.data} />
            <span className="flex flex-col items-end tabular-nums">
              <span className="font-semibold">{r.value}</span>
              <span className="text-xs text-[var(--rd-color-text-muted)]">{r.change}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
