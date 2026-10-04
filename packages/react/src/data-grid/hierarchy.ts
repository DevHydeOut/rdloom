import { getFilteredRowModel, getSortedRowModel, type FilterFn, type RowModel, type Table } from "@tanstack/react-table";
import { columnTest, fastFilteredRowModel, normalize, searchText } from "./filtering";
import { fastSortedRowModel } from "./sorting";

// The fast row models (filtering.ts, sorting.ts) work on one flat list of
// rows. Grouped rows and tree data (getSubRows) need rows filtered and sorted
// inside each parent, which TanStack's own models do. TanStack creates a
// table's row models once, so these pick one or the other on every call.

const isHierarchical = <T,>(table: Table<T>) => table.getState().grouping.length > 0 || !!table.options.getSubRows;

export function filteredRowModel<T>(): (table: Table<T>) => () => RowModel<T> {
  return (table) => {
    const fast = fastFilteredRowModel<T>()(table);
    const nested = getFilteredRowModel<T>()(table);
    return () => (isHierarchical(table) ? nested() : fast());
  };
}

export function sortedRowModel<T>(): (table: Table<T>) => () => RowModel<T> {
  return (table) => {
    const fast = fastSortedRowModel<T>()(table);
    const nested = getSortedRowModel<T>()(table);
    return () => (isHierarchical(table) ? nested() : fast());
  };
}

// The same matching rules as the fast models, as TanStack filter functions.

/** Search: any searchable cell contains the text (or its meta.format text). */
export const searchFilter: FilterFn<any> = (row, columnId, value) => {
  const column = row._getAllCellsByColumnId()[columnId]?.column;
  return !!column && searchText(column, row.getValue(columnId)).includes(normalize(value));
};

/** Column filters: "text" contains, "select" equals. */
export const columnFilter: FilterFn<any> = (row, columnId, value) => {
  const column = row._getAllCellsByColumnId()[columnId]?.column;
  const test = columnTest(column, value);
  return !test || test(row.getValue(columnId));
};
