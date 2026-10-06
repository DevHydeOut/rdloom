/** One key number in the row at the top of a DashboardPage. The same fields as Stat. */
export interface DashboardStat {
  label: string;
  value: string | number;
  /** A signed percentage and what it is compared with, e.g. { change: 12, label: "vs last month" }. */
  trend?: { change: number; label?: string; goodWhen?: "up" | "down" };
  /** A short history, drawn as a small line under the number. */
  data?: number[];
  description?: string;
  /** A short headline in the card, e.g. "Trending up this month". */
  summary?: string;
}
