/** Optional per-column settings, set on columnDef.meta. */
export interface DataGridColumnMeta {
  /** "end" right-aligns the column, for numbers and currency. */
  align?: "start" | "end";
  /** Lets users edit this column's cells. Edits are reported through onCellEdit. */
  editable?: boolean;
  /** Editor type for editable cells. "number" rejects non-numeric input. Defaults to "text". */
  editor?: "text" | "number";
  /** Filter shown in the filter row: "text" (contains) or "select" (one of the column's values). Defaults to "text". */
  filter?: "text" | "select" | false;
  /**
   * Turns the value into display text, e.g. a currency formatter. The cell
   * shows it (unless the column has its own cell renderer), and search and
   * text filters match it as well as the raw value, so "$1,901" finds 1901.74.
   */
  format?: (value: any) => string;
  /**
   * The values a "select" filter offers. Without it the grid lists the
   * column's distinct values in the rows it has, which with serverSide is only
   * the current page: pass the full list from your server instead.
   */
  filterOptions?: readonly string[];
}

/** What the user asked for, sent to onQueryChange when serverSide is on. */
export interface DataGridQuery {
  /** Sort order, first entry first. */
  sorting: { id: string; desc: boolean }[];
  /** Column filters: the text typed in a "text" filter, or the value chosen in a "select" one. */
  filters: { id: string; value: string }[];
  /** The grid's search text (globalFilter). */
  search: string;
  /** Zero-based page. */
  pageIndex: number;
  pageSize: number;
}

export interface DataGridExportOptions {
  /** File name for downloads, without the extension. Defaults to the grid's label. */
  fileName?: string;
  /** "filtered" (default): every row that passes the search and filters. "selected": only the selected rows. */
  scope?: "filtered" | "selected";
  /**
   * CSV only. Prefixes text that starts with =, +, - or @ with an apostrophe so
   * a spreadsheet doesn't run it as a formula. On by default.
   */
  sanitize?: boolean;
}

/** Filled in through the apiRef prop. */
export interface DataGridApi {
  /** The rows as CSV text, header first. */
  getCsv(options?: DataGridExportOptions): string;
  /** Downloads a .csv file. */
  downloadCsv(options?: DataGridExportOptions): void;
  /** Downloads an .xlsx workbook. Numbers stay numbers. */
  downloadExcel(options?: DataGridExportOptions): void;
}

export interface DataGridCellEdit<T> {
  rowId: string;
  columnId: string;
  /** The new value: a string, or a number for editor: "number". */
  value: unknown;
  row: T;
}
