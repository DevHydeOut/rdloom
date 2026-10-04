import { memo, type Column, type Row, type RowModel, type Table } from "@tanstack/react-table";
import type { DataGridColumnMeta } from "./types";

// TanStack's filtered row model calls row.getValue(), String() and
// toLowerCase() for every searchable cell on every keystroke: ~700k calls
// for 100k rows x 7 columns, which measured 450-770ms.
//
// This model builds a lowercase search string per row once per dataset
// (cells joined with a separator no one types, so matches can't span two
// cells) and then each keystroke is a plain includes() over those strings.
//
// Column filters, from the filter row:
//   meta.filter "text"   - cell contains the value (case-insensitive)
//
// With meta.format, search and text filters match the display text too.
//   meta.filter "select" - cell equals the chosen option

const SEPARATOR = "\u0000";
export const normalize = (v: unknown) => (v === null || v === undefined ? "" : String(v).toLocaleLowerCase());

/** The raw value, plus its display text when the column has meta.format. */
export function searchText<T>(column: Column<T, unknown>, value: unknown): string {
  const format = (column.columnDef.meta as DataGridColumnMeta | undefined)?.format;
  if (!format || value === null || value === undefined) return normalize(value);
  const shown = normalize(format(value));
  const raw = normalize(value);
  return shown === raw ? raw : raw + SEPARATOR + shown;
}

export function columnTest<T>(column: Column<T, unknown> | undefined, value: unknown): ((v: unknown) => boolean) | null {
  if (!column || value === undefined || value === "") return null;
  const kind = (column.columnDef.meta as DataGridColumnMeta | undefined)?.filter ?? "text";
  if (kind === "select") {
    const wanted = String(value);
    return (v) => String(v ?? "") === wanted;
  }
  const needle = normalize(value);
  return (v) => searchText(column, v).includes(needle);
}

export function fastFilteredRowModel<T>(): (table: Table<T>) => () => RowModel<T> {
  return (table) => {
    const searchIndex = memo(
      () => [table.getPreFilteredRowModel(), table.getAllLeafColumns()] as const,
      (rowModel, columns) => {
        const searchable = columns.filter((c) => c.getCanGlobalFilter());
        return rowModel.rows.map((row) => searchable.map((c) => searchText(c, row.getValue(c.id))).join(SEPARATOR));
      },
      { key: "searchIndex" },
    );

    return memo(
      () =>
        [table.getPreFilteredRowModel(), table.getState().globalFilter, table.getState().columnFilters, searchIndex()] as const,
      (rowModel, globalFilter, columnFilters, index) => {
        const query = normalize(globalFilter);
        const tests = columnFilters
          .map((f) => ({ id: f.id, test: columnTest(table.getColumn(f.id), f.value) }))
          .filter((t): t is { id: string; test: (v: unknown) => boolean } => t.test !== null);
        if (!query && tests.length === 0) return rowModel;

        const rows: Row<T>[] = [];
        const rowsById: Record<string, Row<T>> = {};
        rowModel.rows.forEach((row, i) => {
          if (query && !index[i].includes(query)) return;
          for (const t of tests) if (!t.test(row.getValue(t.id))) return;
          rows.push(row);
          rowsById[row.id] = row;
        });
        return { rows, flatRows: rows, rowsById };
      },
      { key: "fastFilteredRowModel" },
    );
  };
}
