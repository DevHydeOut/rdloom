/** A round range that always includes zero, with evenly spaced ticks: -50, 0, 50, 100 and not -37, 0, 74. */
export function niceRange(min: number, max: number, wanted = 4): { min: number; max: number; ticks: number[] } {
  const lo = Math.min(0, Number.isFinite(min) ? min : 0);
  const hi = Math.max(0, Number.isFinite(max) ? max : 0);
  if (hi === lo) return { min: 0, max: 1, ticks: [0, 1] };
  const rough = (hi - lo) / wanted;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude;
  const bottom = Math.floor(lo / step) * step;
  const top = Math.ceil(hi / step) * step;
  const count = Math.round((top - bottom) / step);
  const ticks = Array.from({ length: count + 1 }, (_, i) => Number((bottom + i * step).toFixed(10)));
  return { min: Number(bottom.toFixed(10)), max: Number(top.toFixed(10)), ticks };
}

/** 12400 -> "12.4K" for the axis; exact values stay in the tooltip and the table. */
export const compact = (value: number) => new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);

export function withUnit(text: string, unit?: string) {
  if (!unit) return text;
  return /^[$€£¥₹]$/.test(unit) ? `${unit}${text}` : `${text}${/^[%‰]$/.test(unit) ? "" : " "}${unit}`;
}

export const exactNumber = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 3 });

/** Whole percentages that add up to exactly 100 (largest remainder), so a legend never reads 99% or 101%. */
export function percentages(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const floors = raw.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return floors;
}

/** Angles run clockwise from the top. */
export function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.sin(angle), cy - r * Math.cos(angle)];
}

export function sectorPath(cx: number, cy: number, outer: number, inner: number, from: number, to: number): string {
  const large = to - from > Math.PI ? 1 : 0;
  const [x0, y0] = polar(cx, cy, outer, from);
  const [x1, y1] = polar(cx, cy, outer, to);
  const [x2, y2] = polar(cx, cy, inner, to);
  const [x3, y3] = polar(cx, cy, inner, from);
  return `M${x0} ${y0}A${outer} ${outer} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${inner} ${inner} 0 ${large} 0 ${x3} ${y3}Z`;
}
