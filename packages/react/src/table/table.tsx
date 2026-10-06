"use client";

import { forwardRef, type ReactNode } from "react";
import {
  Cell,
  Checkbox,
  Column,
  Row,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableHeader as AriaTableHeader,
  useTableOptions,
  type CellProps,
  type ColumnProps,
  type RowProps,
  type TableBodyProps,
  type TableHeaderProps,
  type TableProps as AriaTableProps,
} from "react-aria-components";
import { tableDefaults, type TableSpecProps } from "../generated/table.types";
import { cx } from "../utils/cx";
import { CheckIcon, SortIcon } from "../utils/icons";

export type { SortDescriptor } from "react-aria-components";

export interface TableProps
  extends TableSpecProps,
    Omit<AriaTableProps, keyof TableSpecProps | "className" | "children" | "aria-label"> {
  className?: string;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { label, children, density = tableDefaults.density, selectionMode = tableDefaults.selectionMode, className, ...rest },
  ref,
) {
  return (
    // The wrapper scrolls sideways on a narrow screen instead of squashing the columns.
    <div
      data-density={density}
      className={cx(
        "group/table overflow-x-auto rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)]",
        "bg-[var(--rd-color-surface-default)] [box-shadow:var(--rd-elevation-raised)]",
        className,
      )}
    >
      <AriaTable
        {...rest}
        ref={ref}
        aria-label={label}
        selectionMode={selectionMode === "none" ? undefined : selectionMode}
        className="w-full border-collapse text-start text-sm text-[var(--rd-color-text-default)] outline-none"
      >
        {children}
      </AriaTable>
    </div>
  );
});

function SelectBox() {
  return (
    <Checkbox
      slot="selection"
      className="group/box flex size-4 items-center justify-center rounded-[var(--rd-radius-sm,4px)] border border-[var(--rd-color-border-strong)] outline-none data-[selected]:border-transparent data-[selected]:bg-[var(--rd-color-action-primary)] data-[indeterminate]:border-transparent data-[indeterminate]:bg-[var(--rd-color-action-primary)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
    >
      {({ isSelected, isIndeterminate }) =>
        isIndeterminate ? (
          <span className="h-0.5 w-2 rounded bg-[var(--rd-color-action-on-primary)]" />
        ) : isSelected ? (
          <span className="text-[var(--rd-color-action-on-primary)] [&_svg]:text-[var(--rd-color-action-on-primary)]">
            <CheckIcon />
          </span>
        ) : null
      }
    </Checkbox>
  );
}

export function TableHeader({ children, className, ...rest }: Omit<TableHeaderProps<object>, "className" | "children"> & { className?: string; children: ReactNode }) {
  const { selectionBehavior, selectionMode } = useTableOptions();
  return (
    <AriaTableHeader {...rest} className={cx("border-b border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]", className)}>
      {selectionBehavior === "toggle" && selectionMode !== "none" && (
        <Column className="w-11 px-3 py-2 text-start">
          <SelectBox />
        </Column>
      )}
      {children}
    </AriaTableHeader>
  );
}

export interface TableColumnProps extends Omit<ColumnProps, "className" | "children"> {
  className?: string;
  children: ReactNode;
}

/** A column header. Set `isRowHeader` on the column that names each row, and `allowsSorting` to make it sortable. */
export function TableColumn({ children, className, ...rest }: TableColumnProps) {
  return (
    <Column
      {...rest}
      className={cx(
        "px-3 py-2 text-start text-xs font-semibold uppercase tracking-wide text-[var(--rd-color-text-muted)] outline-none " +
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-inset data-[focus-visible]:ring-[var(--rd-color-focus-ring)] " +
          "data-[allows-sorting]:cursor-pointer data-[allows-sorting]:hover:text-[var(--rd-color-text-default)]",
        className,
      )}
    >
      {({ allowsSorting, sortDirection }) => (
        <span className="inline-flex items-center gap-1">
          {children}
          {allowsSorting && <SortIcon direction={sortDirection === "ascending" ? "asc" : sortDirection === "descending" ? "desc" : false} className="size-3.5 shrink-0" />}
        </span>
      )}
    </Column>
  );
}

export function TableBody<T extends object>({ className, ...rest }: Omit<TableBodyProps<T>, "className"> & { className?: string }) {
  return <AriaTableBody<T> {...rest} className={className} />;
}

export function TableRow<T extends object>({ children, className, ...rest }: Omit<RowProps<T>, "className" | "children"> & { className?: string; children: ReactNode }) {
  const { selectionBehavior, selectionMode } = useTableOptions();
  return (
    <Row
      {...rest}
      className={cx(
        "border-b border-[var(--rd-color-border-default)] last:border-b-0 outline-none " +
          "data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[selected]:bg-[var(--rd-color-surface-selected)] " +
          "data-[focus-visible]:ring-2 data-[focus-visible]:ring-inset data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
        className,
      )}
    >
      {selectionBehavior === "toggle" && selectionMode !== "none" && (
        <Cell className="px-3 py-2">
          <SelectBox />
        </Cell>
      )}
      {children}
    </Row>
  );
}

export function TableCell({ className, ...rest }: Omit<CellProps, "className"> & { className?: string }) {
  return (
    <Cell
      {...rest}
      className={cx(
        "px-3 text-start outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-inset data-[focus-visible]:ring-[var(--rd-color-focus-ring)]",
        "py-2.5 group-data-[density=compact]/table:py-1.5 group-data-[density=comfortable]/table:py-4",
        className,
      )}
    />
  );
}
