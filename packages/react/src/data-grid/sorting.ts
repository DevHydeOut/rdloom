import { memo, type Row, type RowModel, type SortingFn, type SortingState, type Table } from "@tanstack/react-table";

// TanStack's default sorting reads each cell through row.getValue() on every
// comparison and, for strings, picks an "alphanumeric" compare that splits
// both strings with a regex each time. On 100k date strings that took ~1.3s.
//
// This row model:
//  1. sorts *all* rows once per sort change: each sorted value is read once,
//     then an array of indexes is sorted (numbers and Dates by subtraction,
//     ISO date strings as plain strings, everything else with Intl.Collator:
//     natural numbers, locale-aware);
//  2. on each filter change, keeps that order and just drops filtered-out
//     rows, which is a single O(n) pass instead of a new sort.
//
// Rules: empty values (null, undefined, "") always sort last, in both
// directions. A column with its own sortingFn *function* keeps it. Ties keep
// their original order. Sub-rows are not sorted (the grid doesn't group).

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const isEmpty = (v: unknown) => v === null || v === undefined || v === "";

// ISO dates/date-times without a UTC offset (or all in Z) sort correctly as
// plain strings, and ~10x faster than the numeric collator. Offsets like
// +05:30 are excluded: comparing those as text would be wrong.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z?)?$/;
const plainCompare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

type Comparator = (a: number, b: number) => number;

function sortRows<T>(table: Table<T>, rows: Row<T>[], sorting: SortingState): Row<T>[] | null {
  const comparators: Comparator[] = [];
  for (const sort of sorting) {
    const column = table.getColumn(sort.id);
    if (!column?.getCanSort()) continue;
    const dir = sort.desc ? -1 : 1;
    const custom = column.columnDef.sortingFn;

    if (typeof custom === "function") {
      const fn = custom as SortingFn<T>;
      comparators.push((a, b) => dir * fn(rows[a], rows[b], sort.id));
      continue;
    }

    const values = rows.map((r) => r.getValue(sort.id));
    const empty = values.map(isEmpty);
    const numeric = values.every((v, i) => empty[i] || typeof v === "number");
    const dates = !numeric && values.every((v, i) => empty[i] || v instanceof Date);
    const keys = numeric ? (values as number[]) : dates ? values.map((v) => (v as Date)?.getTime()) : values.map(String);
    const isoStrings = !numeric && !dates && (keys as string[]).every((k, i) => empty[i] || ISO_DATE.test(k));
    const compareText = isoStrings ? plainCompare : collator.compare;

    comparators.push((a, b) => {
      if (empty[a] || empty[b]) return empty[a] === empty[b] ? 0 : empty[a] ? 1 : -1; // last, either direction
      if (numeric || dates) return dir * ((keys[a] as number) - (keys[b] as number));
      return dir * compareText(keys[a] as string, keys[b] as string);
    });
  }
  if (!comparators.length) return null;

  const order = rows.map((_, i) => i);
  order.sort((a, b) => {
    for (const compare of comparators) {
      const result = compare(a, b);
      if (result !== 0) return result;
    }
    return a - b; // stable
  });
  return order.map((i) => rows[i]);
}

export function fastSortedRowModel<T>(): (table: Table<T>) => () => RowModel<T> {
  return (table) => {
    // Step 1: the order of every row, recomputed only when the sort or data changes.
    const fullOrder = memo(
      () => [table.getState().sorting, table.getCoreRowModel()] as const,
      (sorting, core) => (sorting.length && core.rows.length ? sortRows(table, core.rows, sorting) : null),
      { key: "fastSortedRowModel.fullOrder" },
    );

    // Step 2: apply that order to the filtered rows.
    return memo(
      () => [table.getPreSortedRowModel(), fullOrder(), table.getCoreRowModel()] as const,
      (filtered, order, core) => {
        if (!order) return filtered;
        if (filtered.rows.length === core.rows.length) {
          return { rows: order, flatRows: order, rowsById: filtered.rowsById }; // nothing filtered out
        }
        const keep = new Uint8Array(core.rows.length);
        for (const r of filtered.rows) keep[r.index] = 1;
        const rows = order.filter((r) => keep[r.index] === 1);
        return { rows, flatRows: rows, rowsById: filtered.rowsById };
      },
      { key: "fastSortedRowModel" },
    );
  };
}
