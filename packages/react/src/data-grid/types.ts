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
}

export interface DataGridCellEdit<T> {
  rowId: string;
  columnId: string;
  /** The new value: a string, or a number for editor: "number". */
  value: unknown;
  row: T;
}
