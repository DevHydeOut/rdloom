"use client";

import { forwardRef, useId, useMemo, useState } from "react";
import { Button } from "../button/button";
import { generatedChartDefaults, type GeneratedChartSpecProps } from "../generated/generated-chart.types";
import type { ChartData } from "../utils/ai";
import { cx } from "../utils/cx";
import { useDefaultLocale } from "../utils/use-default-locale";

export interface GeneratedChartProps extends GeneratedChartSpecProps {
  className?: string;
}

// One drawing, one data table. The chart is for people who can see it; the table is the same data
// for everyone else and for anyone who wants exact numbers. Series differ by shape as well as color.
const SERIES_COLORS = [
  "var(--rd-color-action-primary)",
  "var(--rd-color-feedback-info)",
  "var(--rd-color-feedback-success)",
  "var(--rd-color-feedback-warning)",
  "var(--rd-color-neutral-500)",
];
const WIDTH = 640;
const HEIGHT = 300;
const PAD = { top: 16, right: 16, bottom: 36, left: 56 };

/** A round maximum and evenly spaced ticks, so the axis reads 0, 50, 100 and not 0, 37, 74. */
export function niceScale(max: number, wanted = 4): { max: number; ticks: number[] } {
  if (!Number.isFinite(max) || max <= 0) return { max: 1, ticks: [0, 1] };
  const rough = max / wanted;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return { max: top, ticks };
}

/** 12400 -> "12.4K" for the axis; exact values stay in the table. */
const compact = (value: number, locale: string) => new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value);

function withUnit(text: string, unit?: string) {
  if (!unit) return text;
  return /^[$€£¥₹]$/.test(unit) ? `${unit}${text}` : `${text}${/^[%‰]$/.test(unit) ? "" : " "}${unit}`;
}

function Marker({ shape, x, y, color, size = 4.5 }: { shape: number; x: number; y: number; color: string; size?: number }) {
  const common = { fill: color, stroke: "var(--rd-color-surface-default)", strokeWidth: 1.5 };
  switch (shape % 3) {
    case 0:
      return <circle cx={x} cy={y} r={size} {...common} />;
    case 1:
      return <rect x={x - size} y={y - size} width={size * 2} height={size * 2} {...common} />;
    default:
      return <path d={`M${x} ${y - size - 1}L${x + size + 1} ${y + size}L${x - size - 1} ${y + size}Z`} {...common} />;
  }
}

/** A short sentence for the summary when the sender didn't write one. */
function describe(data: ChartData, type: "bar" | "line", locale: string): string {
  const { labels, series, unit } = data;
  if (labels.length === 0 || series.length === 0) return "No data";
  const first = series[0];
  const values = first.values;
  const high = Math.max(...values);
  const low = Math.min(...values);
  const at = (v: number) => labels[values.indexOf(v)];
  const lead = `${type === "bar" ? "Bar" : "Line"} chart of ${series.map((s) => s.name).join(", ")} across ${labels.length} points.`;
  return `${lead} ${first.name} is highest at ${withUnit(high.toLocaleString(locale), unit)} (${at(high)}) and lowest at ${withUnit(low.toLocaleString(locale), unit)} (${at(low)}).`;
}

/**
 * A chart an assistant produced. It draws bars or lines in plain SVG with no chart library, always
 * shows a written summary, and has a "View as table" switch that swaps the drawing for the same data.
 */
export const GeneratedChart = forwardRef<HTMLElement, GeneratedChartProps>(function GeneratedChart(
  { data, title, summary, type = generatedChartDefaults.type, className },
  ref,
) {
  const locale = useDefaultLocale();
  const [asTable, setAsTable] = useState(false);
  const titleId = useId();
  const tableId = useId();
  const { labels, series, unit } = data;

  const all = series.flatMap((s) => s.values);
  const { max, ticks } = useMemo(() => niceScale(Math.max(0, ...all)), [all.join(",")]);
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const band = labels.length > 0 ? plotW / labels.length : plotW;
  const x = (i: number) => PAD.left + band * i + band / 2;
  const groupW = Math.min(band * 0.7, 56 * series.length);
  const barW = series.length > 0 ? groupW / series.length : groupW;
  const direct = labels.length * series.length <= 12; // few enough bars to label each one
  const text = summary ?? describe(data, type, locale);
  const empty = labels.length === 0 || series.length === 0;

  return (
    <figure ref={ref} aria-labelledby={titleId} className={cx("flex flex-col gap-2", className)}>
      <figcaption className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span id={titleId} className="text-sm font-semibold text-[var(--rd-color-text-default)]">
            {title}
          </span>
          <span className="max-w-prose text-xs text-[var(--rd-color-text-muted)]">{text}</span>
        </div>
        {!empty && (
          <Button variant="secondary" size="sm" aria-pressed={asTable} aria-controls={tableId} onPress={() => setAsTable((v) => !v)}>
            {asTable ? "View as chart" : "View as table"}
          </Button>
        )}
      </figcaption>

      {empty ? (
        <p className="rounded-[var(--rd-radius-control)] border border-dashed border-[var(--rd-color-border-strong)] p-6 text-center text-sm text-[var(--rd-color-text-muted)]">No data to chart.</p>
      ) : (
        <div id={tableId}>
          {asTable ? (
            <div className="overflow-x-auto rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)]" tabIndex={0} role="region" aria-label={`${title}, data table`}>
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">{title}</caption>
                <thead>
                  <tr>
                    <th scope="col" className="border-b border-[var(--rd-color-border-strong)] px-3 py-2 text-start font-medium text-[var(--rd-color-text-muted)]">
                      <span className="sr-only">Category</span>
                    </th>
                    {series.map((s) => (
                      <th key={s.name} scope="col" className="border-b border-[var(--rd-color-border-strong)] px-3 py-2 text-end font-medium text-[var(--rd-color-text-muted)]">
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {labels.map((label, i) => (
                    <tr key={`${label}-${i}`}>
                      <th scope="row" className="border-b border-[var(--rd-color-border-default)] px-3 py-2 text-start font-medium">
                        {label}
                      </th>
                      {series.map((s) => (
                        <td key={s.name} className="border-b border-[var(--rd-color-border-default)] px-3 py-2 text-end tabular-nums">
                          {s.values[i] === undefined ? "" : withUnit(s.values[i].toLocaleString(locale), unit)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              {/* The drawing is decoration for the data above and below it; the summary and table carry the meaning. */}
              <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true" focusable="false" className="h-auto w-full text-[var(--rd-color-text-muted)]">
                {ticks.map((tick) => (
                  <g key={tick}>
                    <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--rd-color-border-default)" strokeWidth={tick === 0 ? 1.5 : 1} />
                    <text x={PAD.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="currentColor">
                      {withUnit(compact(tick, locale), unit)}
                    </text>
                  </g>
                ))}
                {labels.map((label, i) => (
                  <text key={`${label}-${i}`} x={x(i)} y={HEIGHT - PAD.bottom + 18} textAnchor="middle" fontSize="11" fill="currentColor">
                    {label.length > 12 && labels.length > 6 ? `${label.slice(0, 11)}…` : label}
                  </text>
                ))}

                {type === "bar" &&
                  series.map((s, si) =>
                    s.values.map((value, i) => {
                      const left = x(i) - groupW / 2 + si * barW;
                      const top = y(Math.max(0, value));
                      return (
                        <g key={`${s.name}-${i}`}>
                          <rect x={left + 1} y={top} width={Math.max(1, barW - 2)} height={Math.max(0, y(0) - top)} rx="2" fill={SERIES_COLORS[si % SERIES_COLORS.length]} />
                          {direct && (
                            <text x={left + barW / 2} y={top - 5} textAnchor="middle" fontSize="11" fill="var(--rd-color-text-default)">
                              {withUnit(compact(value, locale), unit)}
                            </text>
                          )}
                        </g>
                      );
                    }),
                  )}

                {type === "line" &&
                  series.map((s, si) => {
                    const color = SERIES_COLORS[si % SERIES_COLORS.length];
                    const points = s.values.map((v, i) => [x(i), y(v)] as const);
                    return (
                      <g key={s.name}>
                        <polyline points={points.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
                        {points.map(([px, py], i) => (
                          <Marker key={i} shape={si} x={px} y={py} color={color} />
                        ))}
                      </g>
                    );
                  })}
              </svg>
              {series.length > 1 && (
                <ul aria-label="Legend" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--rd-color-text-default)]">
                  {series.map((s, si) => (
                    <li key={s.name} className="inline-flex items-center gap-1.5">
                      <svg aria-hidden="true" viewBox="0 0 14 14" className="size-3.5" focusable="false">
                        {type === "bar" ? (
                          <rect x="1" y="1" width="12" height="12" rx="2" fill={SERIES_COLORS[si % SERIES_COLORS.length]} />
                        ) : (
                          <Marker shape={si} x={7} y={7} color={SERIES_COLORS[si % SERIES_COLORS.length]} size={4.5} />
                        )}
                      </svg>
                      {s.name}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </figure>
  );
});
