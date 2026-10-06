// The plain logic behind CustomerTable: no React in here, so it is easy to test and to reuse on a server.

export interface Customer {
  id: string;
  name: string;
  email: string;
  company?: string;
  /** The plan they are on, e.g. "Free", "Pro", "Team". Any text: the filter lists what is in your data. */
  plan: string;
  /** Where they are, e.g. "active", "trial", "overdue", "churned". Any text. */
  status: string;
  /** Monthly recurring revenue, in the table's currency. */
  mrr: number;
  /** When they joined: a date such as "2026-03-12". */
  joinedAt: string;
  avatarUrl?: string;
}

export type CustomerSortColumn = "name" | "plan" | "status" | "mrr" | "joinedAt";

export interface CustomerQuery {
  /** Text to look for in name, email and company. */
  search: string;
  /** Show only these statuses. Empty means all. */
  status: string[];
  /** Show only these plans. Empty means all. */
  plan: string[];
  sort: { column: CustomerSortColumn; direction: "ascending" | "descending" } | null;
  /** The page, starting at 1. */
  page: number;
  pageSize: number;
}

export const emptyQuery = (pageSize = 10): CustomerQuery => ({ search: "", status: [], plan: [], sort: null, page: 1, pageSize });

export const isFiltered = (query: Pick<CustomerQuery, "search" | "status" | "plan">) => query.search.trim() !== "" || query.status.length > 0 || query.plan.length > 0;

const same = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" }) === 0;

/** The customers that match the search and the filters. */
export function filterCustomers(customers: Customer[], query: Pick<CustomerQuery, "search" | "status" | "plan">): Customer[] {
  const needle = query.search.trim().toLowerCase();
  return customers.filter((c) => {
    if (needle && !`${c.name} ${c.email} ${c.company ?? ""}`.toLowerCase().includes(needle)) return false;
    if (query.status.length && !query.status.some((s) => same(s, c.status))) return false;
    if (query.plan.length && !query.plan.some((p) => same(p, c.plan))) return false;
    return true;
  });
}

/** Sorted copy. Text sorts in natural order ("Plan 2" before "Plan 10"), money by value, dates by time. Equal rows keep their order. */
export function sortCustomers(customers: Customer[], sort: CustomerQuery["sort"]): Customer[] {
  if (!sort) return customers;
  const direction = sort.direction === "descending" ? -1 : 1;
  const text = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  const compare = (a: Customer, b: Customer): number => {
    switch (sort.column) {
      case "mrr":
        return a.mrr - b.mrr;
      case "joinedAt":
        return (Date.parse(a.joinedAt) || 0) - (Date.parse(b.joinedAt) || 0);
      default:
        return text(a[sort.column], b[sort.column]);
    }
  };
  return customers
    .map((customer, index) => ({ customer, index }))
    .sort((x, y) => compare(x.customer, y.customer) * direction || x.index - y.index)
    .map((x) => x.customer);
}

/** How many pages there are (never fewer than one). */
export const pageCountOf = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

/** One page of the list. A page past the end gives the last page. */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const size = Math.max(1, pageSize);
  const safe = Math.min(Math.max(1, page), pageCountOf(items.length, size));
  return items.slice((safe - 1) * size, safe * size);
}

/** The whole pipeline in the order people expect: search and filter, then sort, then the page. */
export function applyQuery(customers: Customer[], query: CustomerQuery): { rows: Customer[]; total: number; filtered: Customer[] } {
  const filtered = sortCustomers(filterCustomers(customers, query), query.sort);
  return { rows: paginate(filtered, query.page, query.pageSize), total: filtered.length, filtered };
}

/** The distinct values of a field, in the order they first appear. */
export function distinct(customers: Customer[], field: "plan" | "status"): string[] {
  const seen = new Map<string, string>();
  for (const c of customers) if (!seen.has(c[field].toLowerCase())) seen.set(c[field].toLowerCase(), c[field]);
  return [...seen.values()];
}

export interface CustomerSummary {
  total: number;
  active: number;
  churned: number;
  mrr: number;
  /** Monthly revenue of each plan, in the order the plans first appear. */
  byPlan: Array<{ plan: string; mrr: number; customers: number }>;
}

/** Totals for the cards and the chart above the table. Revenue leaves out churned customers; "active" counts status "active" only (a trial is not yet active). */
export function summarize(customers: Customer[]): CustomerSummary {
  const plans = new Map<string, { plan: string; mrr: number; customers: number }>();
  let active = 0;
  let churned = 0;
  let mrr = 0;
  for (const c of customers) {
    const status = c.status.toLowerCase();
    if (status === "active") active++;
    if (status === "churned") churned++;
    if (status !== "churned") mrr += Number.isFinite(c.mrr) ? c.mrr : 0;
    const key = c.plan.toLowerCase();
    const entry = plans.get(key) ?? { plan: c.plan, mrr: 0, customers: 0 };
    entry.customers++;
    if (status !== "churned") entry.mrr += Number.isFinite(c.mrr) ? c.mrr : 0;
    plans.set(key, entry);
  }
  return { total: customers.length, active, churned, mrr, byPlan: [...plans.values()] };
}

// --- Export

const csvCell = (value: string | number): string => {
  let text = String(value);
  // A cell that starts with = + - or @ would run as a formula in a spreadsheet: make it plain text.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** The customers as CSV text: every row passed in, with a header. */
export function customersToCsv(customers: Customer[]): string {
  const rows: Array<Array<string | number>> = [["Name", "Email", "Company", "Plan", "Status", "Monthly revenue", "Joined"], ...customers.map((c) => [c.name, c.email, c.company ?? "", c.plan, c.status, c.mrr, c.joinedAt])];
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

// --- Display

export function formatMoney(value: number, currency = "USD", locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString()}`;
  }
}

export function formatDate(value: string, locale?: string): string {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return value;
  // A date with no time is a calendar day: read it in UTC so it can't slip a day in other time zones.
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(time);
}

/** Two letters for an avatar. */
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

// --- What the cards and the chart above the table show

export interface CustomerStatInput {
  label: string;
  value: string | number;
  trend?: { change: number; label?: string; goodWhen?: "up" | "down" };
  /** A short history, drawn as a small line under the number. */
  data?: number[];
  description?: string;
  /** A short headline in the card, e.g. "Trending up this month". */
  summary?: string;
}

export interface CustomerChartInput {
  title: string;
  data: { labels: string[]; series: Array<{ name: string; values: number[] }>; unit?: string };
  type?: "bar" | "line" | "area" | "donut";
  summary?: string;
}

export interface CustomerInsights {
  stats: CustomerStatInput[];
  chart?: CustomerChartInput;
}
