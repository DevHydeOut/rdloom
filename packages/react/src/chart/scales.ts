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

export type Curve = "smooth" | "linear";
export type Pt = readonly [number, number];

const r3 = (v: number) => Number(v.toFixed(3));

/** Rough width of text at a font size, from character classes. Good enough to keep labels apart. */
export function textWidth(text: string, size = 12): number {
  let units = 0;
  for (const ch of text) {
    if ("iljtf.,:;|!' ".includes(ch)) units += 0.3;
    else if ("mwMW@%".includes(ch)) units += 0.85;
    else if (/[A-Z0-9]/.test(ch)) units += 0.62;
    else units += 0.54;
  }
  return units * size;
}

/** A straight-segment path through the points. Points that are not finite are skipped. */
export function linearPath(points: readonly Pt[]): string {
  const pts = points.filter(([px, py]) => Number.isFinite(px) && Number.isFinite(py));
  return pts.map(([px, py], i) => `${i === 0 ? "M" : "L"}${r3(px)} ${r3(py)}`).join("");
}

/**
 * A smooth path through the points using monotone cubic interpolation (Fritsch-Carlson). Between two
 * points the curve never goes above the higher one or below the lower one, so it cannot invent a peak.
 * The x values must increase.
 */
export function monotonePath(points: readonly Pt[]): string {
  const pts = points.filter(([px, py]) => Number.isFinite(px) && Number.isFinite(py));
  const n = pts.length;
  if (n < 3) return linearPath(pts);
  const dx: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    d[i] = dx[i] === 0 ? 0 : (pts[i + 1][1] - pts[i][1]) / dx[i];
  }
  const m: number[] = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    if (m[i] / d[i] < 0) m[i] = 0;
    if (m[i + 1] / d[i] < 0) m[i + 1] = 0;
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  let out = `M${r3(pts[0][0])} ${r3(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const h = dx[i] / 3;
    out += `C${r3(x0 + h)} ${r3(y0 + m[i] * h)} ${r3(x1 - h)} ${r3(y1 - m[i + 1] * h)} ${r3(x1)} ${r3(y1)}`;
  }
  return out;
}

export const curvePath = (points: readonly Pt[], curve: Curve = "smooth") => (curve === "linear" ? linearPath(points) : monotonePath(points));

/** A closed shape between an upper and a lower edge, both drawn with the same curve. */
export function areaPath(upper: readonly Pt[], lower: readonly Pt[], curve: Curve = "smooth"): string {
  if (upper.length === 0) return "";
  const top = curvePath(upper, curve);
  const back = curvePath([...lower].reverse(), curve).replace(/^M/, "L");
  return `${top}${back}Z`;
}

/** A bar with rounded corners on one side only: the top, the bottom, or none. */
export function barPath(x: number, y: number, w: number, h: number, radius: number, round: "top" | "bottom" | "none" = "top"): string {
  const r = round === "none" ? 0 : Math.max(0, Math.min(radius, w / 2, h));
  const R = (v: number) => r3(v);
  if (r === 0) return `M${R(x)} ${R(y)}h${R(w)}v${R(h)}h${R(-w)}Z`;
  if (round === "top") return `M${R(x)} ${R(y + h)}V${R(y + r)}Q${R(x)} ${R(y)} ${R(x + r)} ${R(y)}H${R(x + w - r)}Q${R(x + w)} ${R(y)} ${R(x + w)} ${R(y + r)}V${R(y + h)}Z`;
  return `M${R(x)} ${R(y)}H${R(x + w)}V${R(y + h - r)}Q${R(x + w)} ${R(y + h)} ${R(x + w - r)} ${R(y + h)}H${R(x + r)}Q${R(x)} ${R(y + h)} ${R(x)} ${R(y + h - r)}Z`;
}
