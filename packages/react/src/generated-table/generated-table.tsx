"use client";

import { forwardRef, useId, useMemo, useState } from "react";
import type { SortDescriptor } from "react-aria-components";
import { generatedTableDefaults, type GeneratedTableSpecProps } from "../generated/generated-table.types";
import { Button } from "../button/button";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "../table/table";
import type { TableData } from "../utils/ai";
import { cx } from "../utils/cx";
import { useDefaultLocale } from "../utils/use-default-locale";

export interface GeneratedTableProps extends GeneratedTableSpecProps {
  className?: string;
}

type Cell = string | number | null;

const isNumber = (value: Cell): value is number => typeof value === "number";

/** A column counts as numeric when every filled cell is a number: it lines up on the right and sorts by value. */
function numericColumns(data: TableData): boolean[] {
  return data.columns.map((_, c) => {
    const values = data.rows.map((row) => row[c]).filter((v) => v !== null && v !== undefined && v !== "");
    return values.length > 0 && values.every(isNumber);
  });
}

/** A CSV cell. Text that starts with = + - or @ is prefixed so a spreadsheet won't run it as a formula. */
const csvCell = (value: Cell): string => {
  let text = value === null || value === undefined ? "" : String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function tableToCsv(data: TableData): string {
  return [data.columns, ...data.rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

/**
 * A table an assistant produced, shown as a real sortable table: a title and summary above it,
 * numbers aligned, long results cut to a few rows with a button to show the rest, and a CSV download.
 */
export const GeneratedTable = forwardRef<HTMLDivElement, GeneratedTableProps>(function GeneratedTable(
  { data, title, summary, maxRows = generatedTableDefaults.maxRows, isSortable = generatedTableDefaults.isSortable, fileName = generatedTableDefaults.fileName, onExport, className },
  ref,
) {
  const [sort, setSort] = useState<SortDescriptor | null>(null);
  const locale = useDefaultLocale();
  const [all, setAll] = useState(false);
  const [notice, setNotice] = useState("");
  const titleId = useId();
  const numeric = useMemo(() => numericColumns(data), [data]);

  const rows = useMemo(() => {
    const indexed = data.rows.map((cells, id) => ({ id, cells }));
    if (!sort?.column) return indexed;
    const c = Number(sort.column);
    const direction = sort.direction === "descending" ? -1 : 1;
    return [...indexed].sort((a, b) => {
      const x = a.cells[c];
      const y = b.cells[c];
      if (x === null || x === undefined || x === "") return 1;
      if (y === null || y === undefined || y === "") return -1;
      const result = isNumber(x) && isNumber(y) ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: "base" });
      return result * direction;
    });
  }, [data.rows, sort]);

  const limited = maxRows > 0 && !all && rows.length > maxRows;
  const shown = limited ? rows.slice(0, maxRows) : rows;

  const exportCsv = () => {
    if (onExport) {
      onExport(data);
      return;
    }
    const url = URL.createObjectURL(new Blob(["﻿" + tableToCsv(data)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Downloaded ${link.download}`);
  };

  return (
    <figure ref={ref} aria-labelledby={titleId} className={cx("flex flex-col gap-2", className)}>
      <figcaption className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span id={titleId} className="text-sm font-semibold text-[var(--rd-color-text-default)]">
            {title}
          </span>
          <span className="text-xs text-[var(--rd-color-text-muted)]">
            {summary ?? `${data.rows.length} ${data.rows.length === 1 ? "row" : "rows"}, ${data.columns.length} columns`}
          </span>
        </div>
        <Button variant="secondary" size="sm" onPress={exportCsv}>
          Download CSV
        </Button>
      </figcaption>

      <Table
        label={title}
        density="compact"
        sortDescriptor={isSortable ? sort : undefined}
        onSortChange={isSortable ? setSort : undefined}
      >
        <TableHeader>
          {data.columns.map((name, c) => (
            <TableColumn key={c} id={String(c)} isRowHeader={c === 0} allowsSorting={isSortable} className={numeric[c] ? "!text-end" : undefined}>
              {name}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody items={shown}>
          {(row) => (
            <TableRow id={row.id}>
              {data.columns.map((_, c) => (
                <TableCell key={c} className={numeric[c] ? "!text-end tabular-nums" : undefined}>
                  {row.cells[c] === null || row.cells[c] === undefined ? "" : isNumber(row.cells[c]) ? (row.cells[c] as number).toLocaleString(locale) : String(row.cells[c])}
                </TableCell>
              ))}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {limited && (
        <div className="flex items-center gap-2 text-xs text-[var(--rd-color-text-muted)]">
          <span>
            Showing {shown.length} of {rows.length} rows
          </span>
          <Button variant="ghost" size="sm" onPress={() => setAll(true)}>
            Show all
          </Button>
        </div>
      )}
      <span role="status" className="sr-only">
        {notice}
      </span>
    </figure>
  );
});
