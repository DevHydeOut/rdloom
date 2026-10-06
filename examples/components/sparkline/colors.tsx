import { Sparkline } from "@rdloom/react";

// Color says "good", "bad" or "just a trend", but the words around it still say so: never rely on color alone.
const rows = [
  { label: "Revenue", note: "Up", color: "primary" as const, data: [21, 24, 22, 30, 28, 35, 41, 48] },
  { label: "Active users", note: "Up", color: "success" as const, data: [40, 42, 45, 44, 50, 55, 58, 63] },
  { label: "Churn", note: "Rising", color: "danger" as const, data: [1.1, 1.2, 1.1, 1.4, 1.5, 1.7, 1.8, 2.1] },
  { label: "Page views", note: "Flat", color: "muted" as const, data: [30, 32, 29, 31, 30, 33, 31, 32] },
];

export default function SparklineColorsExample() {
  return (
    <ul className="flex w-72 flex-col divide-y divide-[var(--rd-color-border-default)] text-sm">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center justify-between gap-4 py-3">
          <span className="flex flex-col">
            <span className="font-medium">{r.label}</span>
            <span className="text-xs text-[var(--rd-color-text-muted)]">{r.note}</span>
          </span>
          <Sparkline type="area" color={r.color} width={112} height={36} data={r.data} />
        </li>
      ))}
    </ul>
  );
}
