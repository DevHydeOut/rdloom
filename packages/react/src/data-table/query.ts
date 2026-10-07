// The plain logic behind DataTable: no React in here, so it is easy to test and to reuse on a server.
// It works on any row type: columns say how to read a value from a row.

import type { ReactNode } from "react";
import type { PermissionValue } from "../utils/permissions";
import type { QuerySchema } from "../utils/url-state";

/** What a column can read from a row: text, a number, a date, a flag, or nothing. */
export type DataTableValue = string | number | boolean | Date | null | undefined;

export interface DataTableColumn<Row> {
  /** Unique name of the column. Also the field read from the row when there is no `value`. */
  id: string;
  /** The column heading, and the label of the value on a phone card. */
  header: string;
  /** What to draw in the cell. Defaults to the value as text. */
  cell?: (row: Row) => ReactNode;
  /** What the column holds, for sorting, searching and the CSV. Defaults to the row's field named `id`. */
  value?: (row: Row) => DataTableValue;
  /** Click the heading to sort by this column. */
  sortable?: boolean;
  /** Align the cell. Use "end" for numbers and money. */
  align?: "start" | "center" | "end";
  /** Leave this column off the phone cards. */
  hideOnMobile?: boolean;
  /** A CSS width such as "8rem". */
  width?: string;
}

export interface DataTableFilterOption {
  value: string;
  label: string;
}

export interface DataTableFilter<Row> {
  /** Unique name. Also the column whose value is compared, unless you give `match`. */
  id: string;
  /** What the filter is called, e.g. "Status". */
  label: string;
  /** The choices: plain text, or { value, label }. */
  options: ReadonlyArray<string | DataTableFilterOption>;
  /** Decide whether a row passes for one chosen value. Defaults to comparing the column's value as text. */
  match?: (row: Row, value: string) => boolean;
}

export type DataTableSortDirection = "ascending" | "descending";

export interface DataTableQuery {
  /** Text to look for. */
  search: string;
  /** The chosen values of each filter, by filter id. A missing or empty list means everything. */
  filters: Record<string, string[]>;
  sort: { column: string; direction: DataTableSortDirection } | null;
  /** The page, starting at 1. */
  page: number;
}

export interface DataTableRowAction<Row> {
  id: string;
  label: string;
  permission?: PermissionValue;
  /** Ask first. The row's name is added to the dialog. */
  confirm?: { title: string; description?: string; confirmLabel?: string };
  /** Shown in the danger color. */
  variant?: "default" | "danger";
  onAction: (row: Row) => void | Promise<unknown>;
}

export interface DataTableBulkAction<Row> {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: "default" | "danger";
  permission?: PermissionValue;
  /** Ask first. The dialog also says how many rows are affected. */
  confirm?: { title: string; description?: string; confirmLabel?: string };
  onAction: (rows: Row[]) => void | Promise<unknown>;
}

export const emptyDataTableQuery = (): DataTableQuery => ({ search: "", filters: {}, sort: null, page: 1 });

/** The query with every part present, from a partial one. */
export const completeQuery = (query?: Partial<DataTableQuery>): DataTableQuery => ({ ...emptyDataTableQuery(), ...query, filters: { ...query?.filters } });

const activeFilters = (filters: DataTableQuery["filters"]) => Object.entries(filters).filter(([, values]) => values.length > 0);

/** True when a search or any filter is set. */
export const isFiltered = (query: Pick<DataTableQuery, "search" | "filters">) => query.search.trim() !== "" || activeFilters(query.filters).length > 0;

/** How many filters are set (the search is not counted). */
export const filterCount = (filters: DataTableQuery["filters"]) => activeFilters(filters).length;

export const normalizeOptions = (options: DataTableFilter<unknown>["options"]): DataTableFilterOption[] => options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));

/** What a column holds for one row. */
export function cellValue<Row>(row: Row, column: DataTableColumn<Row>): DataTableValue {
  const raw = column.value ? column.value(row) : (row as Record<string, unknown>)[column.id];
  if (raw === null || raw === undefined) return raw;
  if (raw instanceof Date || typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") return raw;
  return String(raw);
}

/** A value as plain text. */
export function valueText(value: DataTableValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString() : "";
  return String(value);
}

const same = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" }) === 0;

/** The rows whose searched columns contain the text, ignoring case. `columnIds` limits where to look (default: every column). */
export function searchRows<Row>(rows: Row[], columns: DataTableColumn<Row>[], search: string, columnIds?: readonly string[]): Row[] {
  const needle = search.trim().toLowerCase();
  if (!needle) return rows;
  const where = columns.filter((c) => !columnIds || columnIds.includes(c.id));
  return rows.filter((row) => where.some((c) => valueText(cellValue(row, c)).toLowerCase().includes(needle)));
}

/** The rows that pass every filter that has a choice (any of the chosen values, all filters together). */
export function filterRows<Row>(rows: Row[], columns: DataTableColumn<Row>[], filters: ReadonlyArray<DataTableFilter<Row>>, chosen: DataTableQuery["filters"]): Row[] {
  const active = filters.map((f) => ({ filter: f, values: chosen[f.id] ?? [] })).filter((x) => x.values.length > 0);
  if (!active.length) return rows;
  return rows.filter((row) =>
    active.every(({ filter, values }) => {
      if (filter.match) return values.some((v) => filter.match!(row, v));
      const column = columns.find((c) => c.id === filter.id);
      const text = column ? valueText(cellValue(row, column)) : valueText((row as Record<string, DataTableValue>)[filter.id]);
      return values.some((v) => same(v, text));
    }),
  );
}

const time = (v: DataTableValue) => (v instanceof Date ? v.getTime() : typeof v === "number" ? v : typeof v === "boolean" ? Number(v) : NaN);

function compareValues(a: NonNullable<DataTableValue>, b: NonNullable<DataTableValue>): number {
  const x = time(a);
  const y = time(b);
  if (Number.isFinite(x) && Number.isFinite(y)) return x - y;
  return valueText(a).localeCompare(valueText(b), undefined, { numeric: true, sensitivity: "base" });
}

/** A sorted copy. Text sorts in natural order ("Plan 2" before "Plan 10"), numbers and dates by value, empty values last in either direction. Equal rows keep their order. */
export function sortRows<Row>(rows: Row[], columns: DataTableColumn<Row>[], sort: DataTableQuery["sort"]): Row[] {
  const column = sort && columns.find((c) => c.id === sort.column);
  if (!sort || !column) return rows;
  const direction = sort.direction === "descending" ? -1 : 1;
  return rows
    .map((row, index) => ({ row, index, value: cellValue(row, column) }))
    .sort((x, y) => {
      const xe = x.value === null || x.value === undefined || x.value === "";
      const ye = y.value === null || y.value === undefined || y.value === "";
      if (xe || ye) return xe && ye ? x.index - y.index : xe ? 1 : -1;
      return compareValues(x.value!, y.value!) * direction || x.index - y.index;
    })
    .map((x) => x.row);
}

/** How many pages there are (never fewer than one). */
export const pageCountOf = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

/** One page of the list. A page past the end gives the last page. */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const size = Math.max(1, pageSize);
  const safe = Math.min(Math.max(1, page), pageCountOf(items.length, size));
  return items.slice((safe - 1) * size, safe * size);
}

export interface ApplyOptions<Row> {
  pageSize: number;
  /** Which columns the search looks in (default: all). */
  searchColumns?: readonly string[];
  filters?: ReadonlyArray<DataTableFilter<Row>>;
}

/** The whole pipeline in the order people expect: search and filter, then sort, then the page. `filtered` is every match on every page. */
export function applyDataTableQuery<Row>(rows: Row[], columns: DataTableColumn<Row>[], query: DataTableQuery, { pageSize, searchColumns, filters = [] }: ApplyOptions<Row>): { rows: Row[]; total: number; filtered: Row[] } {
  const found = filterRows(searchRows(rows, columns, query.search, searchColumns), columns, filters, query.filters);
  const filtered = sortRows(found, columns, query.sort);
  return { rows: paginate(filtered, query.page, pageSize), total: filtered.length, filtered };
}

// --- Export

const csvCell = (value: DataTableValue): string => {
  let text = valueText(value);
  // A cell that starts with = + - or @ would run as a formula in a spreadsheet: make it plain text.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** The rows as CSV text, one column per table column (its value, not its drawing), with a header. */
export function rowsToCsv<Row>(rows: Row[], columns: DataTableColumn<Row>[]): string {
  const lines = [columns.map((c) => csvCell(c.header)), ...rows.map((row) => columns.map((c) => csvCell(cellValue(row, c))))];
  return lines.map((line) => line.join(",")).join("\r\n");
}

// --- The address bar

export interface DataTableQuerySchemaOptions {
  /** The ids of the filters, so each gets a parameter of its own. */
  filters?: readonly string[];
  /** The ids of the columns that can be sorted, so only those are accepted from the address. */
  sortColumns?: readonly string[];
}

const RESERVED = ["q", "page", "sort"];
const filterKey = (id: string) => `filter:${id}`;
const filterParam = (id: string) => (RESERVED.includes(id) ? `filter-${id}` : id);

/**
 * A schema for parseQueryState, serializeQueryState and useQueryState that describes a DataTable query:
 * ?q=text&status=paid&sort=total:desc&page=2. Turn the state it gives into a query with
 * dataTableQueryFromState, and a query into state with dataTableQueryToState.
 */
export function dataTableQuerySchema({ filters = [], sortColumns = [] }: DataTableQuerySchemaOptions = {}): QuerySchema {
  const schema: QuerySchema = {
    search: { type: "string", default: "", name: "q" },
    page: { type: "number", default: 1, min: 1, integer: true },
    sort: { type: "enum", values: ["", ...sortColumns.flatMap((c) => [`${c}:asc`, `${c}:desc`])], default: "", name: "sort" },
  };
  for (const id of filters) schema[filterKey(id)] = { type: "array", default: [], name: filterParam(id) };
  return schema;
}

/** The state read from the address (by dataTableQuerySchema) as a DataTable query. */
export function dataTableQueryFromState(state: Record<string, unknown>, { filters = [] }: DataTableQuerySchemaOptions = {}): DataTableQuery {
  const sort = String(state.sort ?? "");
  const cut = sort.lastIndexOf(":");
  const chosen: Record<string, string[]> = {};
  for (const id of filters) {
    const list = state[filterKey(id)];
    if (Array.isArray(list) && list.length) chosen[id] = list.map(String);
  }
  return {
    search: String(state.search ?? ""),
    filters: chosen,
    sort: cut > 0 ? { column: sort.slice(0, cut), direction: sort.slice(cut + 1) === "desc" ? "descending" : "ascending" } : null,
    page: Math.max(1, Math.trunc(Number(state.page) || 1)),
  };
}

/** A DataTable query as the state dataTableQuerySchema describes, to write to the address. */
export function dataTableQueryToState(query: DataTableQuery, { filters = [] }: DataTableQuerySchemaOptions = {}): Record<string, string | number | string[]> {
  const state: Record<string, string | number | string[]> = {
    search: query.search,
    page: query.page,
    sort: query.sort ? `${query.sort.column}:${query.sort.direction === "descending" ? "desc" : "asc"}` : "",
  };
  for (const id of filters) state[filterKey(id)] = query.filters[id] ?? [];
  return state;
}
