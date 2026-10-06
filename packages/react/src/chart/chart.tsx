"use client";

import { forwardRef, useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Button } from "../button/button";
import { chartDefaults, type ChartSpecProps } from "../generated/chart.types";
import type { ChartData } from "../utils/ai";
import { cx } from "../utils/cx";
import { compact, exactNumber, niceRange, percentages, polar, sectorPath, withUnit } from "./scales";

export interface ChartProps extends ChartSpecProps {
  className?: string;
}

export interface ChartPoint {
  index: number;
  label: string;
  series: string;
  value: number;
}

// The drawing is for people who can see it. The summary, the announcements and the table carry the
// same data for everyone else. Series differ by marker shape as well as color.
const SHAPES = ["circle", "square", "triangle", "diamond", "triangle-down", "cross"] as const;
type Shape = (typeof SHAPES)[number];
export const chartColor = (index: number) => `var(--rd-color-chart-${(index % 6) + 1})`;
const FALLBACK_WIDTH = 640;
const PAD = { top: 16, right: 16, bottom: 32 };
const TIP_WIDTH = 176;

function Marker({ shape, x, y, color, size = 4.5, mark }: { shape: number; x: number; y: number; color: string; size?: number; mark?: string }) {
  const kind: Shape = SHAPES[shape % SHAPES.length];
  const common = { fill: color, stroke: "var(--rd-color-surface-default)", strokeWidth: 1.5, "data-shape": kind, "data-mark": mark };
  const s = size + 0.5;
  switch (kind) {
    case "circle":
      return <circle cx={x} cy={y} r={size} {...common} />;
    case "square":
      return <rect x={x - size} y={y - size} width={size * 2} height={size * 2} {...common} />;
    case "triangle":
      return <path d={`M${x} ${y - s - 1}L${x + s + 1} ${y + s}L${x - s - 1} ${y + s}Z`} {...common} />;
    case "triangle-down":
      return <path d={`M${x} ${y + s + 1}L${x + s + 1} ${y - s}L${x - s - 1} ${y - s}Z`} {...common} />;
    case "diamond":
      return <path d={`M${x} ${y - s - 1}L${x + s + 1} ${y}L${x} ${y + s + 1}L${x - s - 1} ${y}Z`} {...common} />;
    default: {
      const a = s * 0.45;
      return (
        <path
          d={`M${x - a} ${y - s}h${a * 2}v${s - a}h${s - a}v${a * 2}h${-(s - a)}v${s - a}h${-a * 2}v${-(s - a)}h${-(s - a)}v${-a * 2}h${s - a}Z`}
          {...common}
        />
      );
    }
  }
}

function seriesValues(data: ChartData, i: number) {
  return data.labels.map((_, k) => {
    const v = data.series[i].values[k];
    return Number.isFinite(v) ? v : 0;
  });
}

/** A short sentence for the summary when the sender didn't write one. */
function describe(data: ChartData, type: "bar" | "line" | "area" | "donut", stacked: boolean, fmt: (v: number) => string): string {
  const { labels, series } = data;
  if (labels.length === 0 || series.length === 0) return "No data";
  const values = seriesValues(data, 0);
  if (type === "donut") {
    const total = values.reduce((a, b) => a + Math.max(0, b), 0);
    const pct = percentages(values.map((v) => Math.max(0, v)));
    const top = values.indexOf(Math.max(...values));
    return `Donut chart of ${series[0].name} across ${labels.length} parts, ${fmt(total)} in all. ${labels[top]} is the largest at ${pct[top]}%.`;
  }
  const high = Math.max(...values);
  const low = Math.min(...values);
  const kind = `${stacked && type !== "line" ? "Stacked " : ""}${type === "bar" ? "bar" : type} chart`;
  const lead = `${kind[0].toUpperCase()}${kind.slice(1)} of ${series.map((s) => s.name).join(", ")} across ${labels.length} ${labels.length === 1 ? "point" : "points"}.`;
  return `${lead} ${series[0].name} is highest at ${fmt(high)} (${labels[values.indexOf(high)]}) and lowest at ${fmt(low)} (${labels[values.indexOf(low)]}).`;
}

/**
 * A bar, line, area or donut chart in plain SVG, no chart library. It draws at the real width of its
 * container, can be explored with a pointer or the arrow keys, and always has a written summary and a
 * "View as table" switch that swaps the drawing for the same data.
 */
export const Chart = forwardRef<HTMLElement, ChartProps>(function Chart(
  {
    data,
    title,
    summary,
    type = chartDefaults.type,
    stacked = chartDefaults.stacked,
    height = chartDefaults.height,
    showLegend = chartDefaults.showLegend,
    showGrid = chartDefaults.showGrid,
    valueFormat,
    onSelect,
    isLoading = chartDefaults.isLoading,
    emptyMessage = chartDefaults.emptyMessage,
    className,
  },
  ref,
) {
  const [asTable, setAsTable] = useState(false);
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  const [active, setActive] = useState<number | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const summaryId = useId();
  const tableId = useId();

  const { labels, series, unit } = data;
  const n = labels.length;
  const empty = n === 0 || series.length === 0;
  const donut = type === "donut";
  const exact = valueFormat ?? ((v: number) => withUnit(exactNumber(v), unit));
  const axisFormat = valueFormat ?? ((v: number) => withUnit(compact(v), unit));
  const text = summary ?? describe(data, type, stacked, exact);
  const showingPlot = !isLoading && !empty && !asTable;

  // Draw at the real pixel width so text never scales. Without ResizeObserver (SSR, jsdom) keep the fallback.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const read = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setWidth(w);
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [showingPlot]);

  const act = active !== null && active < n ? active : null;
  const vals = empty ? [] : series.map((_, i) => seriesValues(data, i));

  // Donut: the first series only, negatives count as zero.
  const donutValues = donut && !empty ? vals[0].map((v) => Math.max(0, v)) : [];
  const donutTotal = donutValues.reduce((a, b) => a + b, 0);
  const pct = percentages(donutValues);

  // Cartesian geometry: per series and category, the lowest and highest drawn value.
  const stackedMode = stacked && (type === "bar" || type === "area");
  const lo: number[][] = [];
  const hi: number[][] = [];
  const edge: number[][] = [];
  if (!empty && !donut) {
    const pos = new Array(n).fill(0);
    const neg = new Array(n).fill(0);
    const cum = new Array(n).fill(0);
    vals.forEach((row, si) => {
      lo[si] = [];
      hi[si] = [];
      edge[si] = [];
      row.forEach((v, i) => {
        if (type === "bar") {
          if (!stackedMode) {
            lo[si][i] = Math.min(0, v);
            hi[si][i] = Math.max(0, v);
          } else if (v >= 0) {
            lo[si][i] = pos[i];
            hi[si][i] = pos[i] += v;
          } else {
            hi[si][i] = neg[i];
            lo[si][i] = neg[i] += v;
          }
          edge[si][i] = v;
        } else if (type === "area" && stackedMode) {
          lo[si][i] = cum[i];
          hi[si][i] = cum[i] += v;
          edge[si][i] = cum[i];
        } else if (type === "area") {
          lo[si][i] = 0;
          hi[si][i] = v;
          edge[si][i] = v;
        } else {
          lo[si][i] = v;
          hi[si][i] = v;
          edge[si][i] = v;
        }
      });
    });
  }
  const flatLo = lo.flat();
  const flatHi = hi.flat();
  const range = niceRange(flatLo.length ? Math.min(...flatLo, ...flatHi) : 0, flatHi.length ? Math.max(...flatLo, ...flatHi) : 0);
  const padLeft = Math.max(36, Math.ceil(Math.max(...range.ticks.map((t) => axisFormat(t).length)) * 6.5) + 16);
  const plotW = Math.max(10, width - padLeft - PAD.right);
  const plotH = Math.max(10, height - PAD.top - PAD.bottom);
  const y = (v: number) => PAD.top + plotH - ((v - range.min) / (range.max - range.min)) * plotH;
  const band = n > 0 ? plotW / n : plotW;
  const x = (i: number) => padLeft + band * i + band / 2;
  const count = series.length || 1;
  const groupW = stackedMode || type !== "bar" ? Math.min(band * 0.7, 64) : Math.min(band * 0.7, 48 * count);
  const barW = stackedMode ? groupW : groupW / count;
  const direct = type === "bar" && (stackedMode ? n <= 12 : n * count <= 12);
  const maxLabels = Math.max(1, Math.floor(plotW / 48));
  const labelStep = Math.ceil(n / maxLabels);
  const maxChars = Math.max(3, Math.floor((band * labelStep) / 6.5));
  const y0 = y(0);

  // Donut geometry.
  const size = Math.min(width, height);
  const dcx = width / 2;
  const dcy = height / 2;
  const outer = Math.max(20, size / 2 - 10);
  const inner = outer * 0.62;
  const live = donutValues.filter((v) => v > 0).length;
  const gap = live > 1 ? 0.03 : 0;
  const slices: { from: number; to: number; mid: number }[] = [];
  {
    let start = 0;
    donutValues.forEach((v) => {
      const sweep = donutTotal > 0 ? (v / donutTotal) * Math.PI * 2 : 0;
      slices.push({ from: start + gap / 2, to: Math.min(start + sweep - gap / 2, start + Math.PI * 2 - 0.0001), mid: start + sweep / 2 });
      start += sweep;
    });
  }

  const sentence = (i: number) => {
    if (donut) return `${labels[i]}: ${exact(vals[0][i])}, ${pct[i]}%`;
    return `${labels[i]}: ${series.map((s, si) => `${s.name} ${exact(vals[si][i])}`).join(", ")}`;
  };

  const move = (next: number | null, byKeyboard: boolean) => {
    setActive(next);
    if (byKeyboard) {
      setPointer(null);
      setAnnouncement(next === null ? "" : sentence(next));
    }
  };

  const pick = (index: number, si: number) => {
    if (!onSelect || index < 0 || index >= n) return;
    onSelect({ index, label: labels[index], series: series[si].name, value: vals[si][index] });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (n === 0) return;
    const forward = event.key === "ArrowRight" || (donut && event.key === "ArrowDown");
    const backward = event.key === "ArrowLeft" || (donut && event.key === "ArrowUp");
    if (forward) move(act === null ? 0 : Math.min(n - 1, act + 1), true);
    else if (backward) move(act === null ? n - 1 : Math.max(0, act - 1), true);
    else if (event.key === "Home") move(0, true);
    else if (event.key === "End") move(n - 1, true);
    else if (event.key === "Escape") move(null, true);
    else if (event.key === "Enter" || event.key === " ") {
      if (act !== null) pick(act, 0);
    } else return;
    event.preventDefault();
  };

  const local = (event: MouseEvent) => {
    const rect = plotRef.current?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  };
  const indexAt = (px: number) => Math.min(n - 1, Math.max(0, Math.floor((px - padLeft) / band)));

  const onMove = (event: MouseEvent) => {
    if (donut || n === 0) return;
    const p = local(event);
    setActive(indexAt(p.x));
    setPointer(p);
  };
  const onClick = (event: MouseEvent) => {
    if (donut || n === 0) return;
    const p = local(event);
    const i = indexAt(p.x);
    const si = type === "bar" && !stackedMode ? Math.min(count - 1, Math.max(0, Math.floor((p.x - (x(i) - groupW / 2)) / barW))) : 0;
    pick(i, si);
  };
  const clear = () => {
    setActive(null);
    setPointer(null);
  };

  // The tooltip follows the pointer, or sits at the active mark for the keyboard, and stays inside the chart.
  let tip: { left: number; top: number } | null = null;
  if (act !== null && showingPlot) {
    const slice = slices[act];
    const [sx, sy] = donut && slice ? polar(dcx, dcy, (outer + inner) / 2, slice.mid) : [x(act), PAD.top + 8];
    const ax = pointer?.x ?? sx;
    const ay = pointer?.y ?? sy;
    const rows = donut ? 1 : series.length;
    const tipH = 30 + rows * 18;
    const left = ax + 14 + TIP_WIDTH > width ? ax - 14 - TIP_WIDTH : ax + 14;
    tip = { left: Math.max(0, left), top: Math.min(Math.max(0, ay - 8), Math.max(0, height - tipH)) };
  }

  return (
    <figure ref={ref} aria-labelledby={titleId} aria-busy={isLoading || undefined} className={cx("flex min-w-0 flex-col gap-2", className)}>
      <figcaption className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span id={titleId} className="text-sm font-semibold text-[var(--rd-color-text-default)]">
            {title}
          </span>
          {!isLoading && !empty && (
            <span id={summaryId} className="max-w-prose text-xs text-[var(--rd-color-text-muted)]">
              {text}
            </span>
          )}
        </div>
        {!isLoading && !empty && (
          <Button variant="secondary" size="sm" aria-pressed={asTable} aria-controls={tableId} onPress={() => { setAsTable((v) => !v); clear(); setAnnouncement(""); }}>
            {asTable ? "View as chart" : "View as table"}
          </Button>
        )}
      </figcaption>

      {isLoading ? (
        <div aria-busy="true">
          <div className="animate-pulse rounded-[var(--rd-radius-control)] bg-[var(--rd-color-border-default)] motion-reduce:animate-none" style={{ height }} />
          <span role="status" className="sr-only">
            Loading chart
          </span>
        </div>
      ) : empty ? (
        <p className="rounded-[var(--rd-radius-control)] border border-dashed border-[var(--rd-color-border-strong)] p-6 text-center text-sm text-[var(--rd-color-text-muted)]">{emptyMessage}</p>
      ) : (
        <div id={tableId} ref={wrapRef} className="relative w-full min-w-0">
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
                      <th scope="row" className="border-b border-[var(--rd-color-border-default)] px-3 py-2 text-start font-medium text-[var(--rd-color-text-default)]">
                        {label}
                      </th>
                      {series.map((s) => (
                        <td key={s.name} className="border-b border-[var(--rd-color-border-default)] px-3 py-2 text-end tabular-nums text-[var(--rd-color-text-default)]">
                          {s.values[i] === undefined ? "" : exact(s.values[i])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              ref={plotRef}
              role="group"
              tabIndex={0}
              aria-label={`${title}. Use the left and right arrow keys to move between values.`}
              aria-describedby={summaryId}
              onKeyDown={onKeyDown}
              onMouseMove={onMove}
              onMouseLeave={clear}
              onClick={onClick}
              onBlur={() => {
                clear();
                setAnnouncement("");
              }}
              className="relative rounded-[var(--rd-radius-control)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
              style={{ height }}
            >
              <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" role="presentation" className="block" fontSize="12">
                {donut ? (
                  <g>
                    {donutTotal === 0 ? (
                      <path data-mark="empty-ring" d={sectorPath(dcx, dcy, outer, inner, 0, Math.PI * 2 - 0.0001)} fill="var(--rd-color-border-default)" />
                    ) : (
                      slices.map((s, i) => {
                        if (!(donutValues[i] > 0)) return null;
                        const [dx, dy] = act === i ? [Math.sin(s.mid) * 6, -Math.cos(s.mid) * 6] : [0, 0];
                        return (
                          <path
                            key={`${labels[i]}-${i}`}
                            data-mark="slice"
                            d={sectorPath(dcx, dcy, outer, inner, s.from, s.to)}
                            fill={chartColor(i)}
                            transform={`translate(${dx} ${dy})`}
                            className="motion-reduce:transition-none"
                            onMouseMove={(event) => {
                              setActive(i);
                              setPointer(local(event));
                            }}
                            onClick={() => pick(i, 0)}
                          />
                        );
                      })
                    )}
                    <text x={dcx} y={dcy - 2} textAnchor="middle" fontSize="20" fontWeight="600" fill="var(--rd-color-text-default)" data-total="">
                      {axisFormat(donutTotal)}
                    </text>
                    <text x={dcx} y={dcy + 16} textAnchor="middle" fill="var(--rd-color-text-muted)">
                      Total
                    </text>
                  </g>
                ) : (
                  <g>
                    {range.ticks.map((tick) => (
                      <g key={tick}>
                        {(showGrid || tick === 0) && (
                          <line x1={padLeft} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--rd-color-border-default)" strokeWidth={tick === 0 ? 1.5 : 1} />
                        )}
                        <text x={padLeft - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" fill="var(--rd-color-text-muted)" data-axis="y">
                          {axisFormat(tick)}
                        </text>
                      </g>
                    ))}
                    {labels.map((label, i) =>
                      i % labelStep === 0 ? (
                        <text key={`${label}-${i}`} x={x(i)} y={height - PAD.bottom + 18} textAnchor="middle" fill="var(--rd-color-text-muted)" data-axis="x">
                          {label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label}
                        </text>
                      ) : null,
                    )}

                    {act !== null && type === "bar" && <rect data-mark="highlight" x={padLeft + band * act} y={PAD.top} width={band} height={plotH} fill="var(--rd-color-border-default)" opacity={0.45} />}
                    {act !== null && type !== "bar" && <line data-mark="guide" x1={x(act)} x2={x(act)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--rd-color-text-muted)" strokeWidth={1} />}

                    {type === "bar" &&
                      series.map((s, si) =>
                        vals[si].map((value, i) => {
                          const left = stackedMode ? x(i) - groupW / 2 : x(i) - groupW / 2 + si * barW;
                          const top = y(hi[si][i]);
                          const bottom = y(lo[si][i]);
                          return (
                            <g key={`${s.name}-${i}`}>
                              <rect
                                data-mark="bar"
                                x={left + 1}
                                y={top}
                                width={Math.max(1, barW - 2)}
                                height={Math.max(0, bottom - top)}
                                rx="2"
                                fill={chartColor(si)}
                                stroke={stackedMode ? "var(--rd-color-surface-default)" : undefined}
                                strokeWidth={stackedMode ? 1 : undefined}
                                className="motion-reduce:transition-none"
                              />
                              {direct && !stackedMode && (
                                <text x={left + barW / 2} y={value >= 0 ? top - 5 : bottom + 14} textAnchor="middle" fill="var(--rd-color-text-default)" data-label="value">
                                  {axisFormat(value)}
                                </text>
                              )}
                            </g>
                          );
                        }),
                      )}
                    {direct &&
                      stackedMode &&
                      labels.map((label, i) => {
                        const total = vals.reduce((sum, row) => sum + row[i], 0);
                        const topEdge = Math.max(...hi.map((row) => row[i]));
                        return (
                          <text key={`${label}-${i}`} x={x(i)} y={y(topEdge) - 5} textAnchor="middle" fill="var(--rd-color-text-default)" data-label="total">
                            {axisFormat(total)}
                          </text>
                        );
                      })}

                    {type === "area" &&
                      series.map((s, si) => {
                        const upper = edge[si].map((v, i) => `${x(i)} ${y(v)}`);
                        const lower = lo[si].map((v, i) => `${x(i)} ${y(v)}`).reverse();
                        return <path key={s.name} data-mark="area" d={`M${upper.join("L")}L${lower.join("L")}Z`} fill={chartColor(si)} fillOpacity={0.22} stroke="none" />;
                      })}

                    {(type === "line" || type === "area") &&
                      series.map((s, si) => {
                        const color = chartColor(si);
                        const points = edge[si].map((v, i) => [x(i), y(v)] as const);
                        return (
                          <g key={s.name}>
                            <polyline data-mark="line" points={points.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
                            {(n <= 40 || act !== null) &&
                              points.map(([px, py], i) =>
                                n <= 40 || i === act ? <Marker key={i} mark="point" shape={si} x={px} y={py} color={color} size={i === act ? 6 : 4.5} /> : null,
                              )}
                          </g>
                        );
                      })}
                  </g>
                )}
              </svg>

              {tip && act !== null && (
                <div
                  role="presentation"
                  aria-hidden="true"
                  data-slot="tooltip"
                  className="pointer-events-none absolute z-10 w-max max-w-[11rem] rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-raised)] px-2.5 py-1.5 text-xs text-[var(--rd-color-text-default)] [box-shadow:var(--rd-elevation-floating)]"
                  style={{ left: tip.left, top: tip.top }}
                >
                  <div className="mb-1 font-semibold">{labels[act]}</div>
                  <ul className="flex flex-col gap-0.5">
                    {(donut ? [0] : series.map((_, si) => si)).map((si) => (
                      <li key={si} className="flex items-center gap-1.5">
                        <svg aria-hidden="true" viewBox="0 0 14 14" className="size-3.5 shrink-0" focusable="false">
                          {donut ? <rect x="1" y="1" width="12" height="12" rx="2" fill={chartColor(act)} /> : <Marker shape={si} x={7} y={7} color={chartColor(si)} size={4} />}
                        </svg>
                        <span className="min-w-0 flex-1 truncate text-[var(--rd-color-text-muted)]">{series[si].name}</span>
                        <span className="tabular-nums">{exact(vals[si][act])}</span>
                        {donut && <span className="tabular-nums text-[var(--rd-color-text-muted)]">{pct[act]}%</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showingPlot && showLegend && (donut || series.length > 1) && (
        <ul aria-label="Legend" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--rd-color-text-default)]">
          {donut
            ? labels.map((label, i) => (
                <li key={`${label}-${i}`} className="inline-flex items-center gap-1.5">
                  <svg aria-hidden="true" viewBox="0 0 14 14" className="size-3.5" focusable="false">
                    <rect x="1" y="1" width="12" height="12" rx="2" fill={chartColor(i)} data-shape="square" />
                  </svg>
                  {label} <span className="tabular-nums text-[var(--rd-color-text-muted)]">{pct[i]}%</span>
                </li>
              ))
            : series.map((s, si) => (
                <li key={s.name} className="inline-flex items-center gap-1.5">
                  <svg aria-hidden="true" viewBox="0 0 14 14" className="size-3.5" focusable="false">
                    {type === "bar" ? <rect x="1" y="1" width="12" height="12" rx="2" fill={chartColor(si)} data-shape="square" /> : <Marker shape={si} x={7} y={7} color={chartColor(si)} size={4.5} />}
                  </svg>
                  {s.name}
                </li>
              ))}
        </ul>
      )}

      {!isLoading && !empty && (
        <div role="status" className="sr-only">
          {announcement}
        </div>
      )}
    </figure>
  );
});
