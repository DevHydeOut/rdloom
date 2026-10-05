"use client";

import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnSizingState,
  type ExpandedState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "../button/button";
import { dataGridDefaults, type DataGridSpecProps } from "../generated/data-grid.types";
import { cx } from "../utils/cx";
import { Spinner } from "../utils/icons";
import { columnFilter, filteredRowModel, searchFilter, sortedRowModel } from "./hierarchy";
import { ColumnMenu, RowHandle, SetFilter, type ColumnMenuAction } from "./column-ui";
import { extendValues } from "./fill";
import { download, parseTsv, toCsv, toTsv, toXlsx, type ExportValue } from "./tabular";
import type { DataGridApi, DataGridCellEdit, DataGridColumnMeta, DataGridExportOptions, DataGridQuery, DataGridRowMove } from "./types";

export type { DataGridApi, DataGridCellEdit, DataGridColumnMeta, DataGridExportOptions, DataGridQuery, DataGridRowMove } from "./types";

export interface DataGridProps<T>
  extends Omit<
    DataGridSpecProps,
    "data" | "columns" | "getRowId" | "onRowAction" | "onCellEdit" | "onCellsEdit" | "onRowReorder" | "getSubRows" | "renderDetail" | "apiRef"
  > {
  data: readonly T[];
  columns: ColumnDef<T, any>[];
  getRowId?: (row: T, index: number) => string;
  onRowAction?: (row: T) => void;
  onCellEdit?: (edit: DataGridCellEdit<T>) => void;
  /** Called once with every cell a paste changes. Without it, a paste calls onCellEdit per cell. */
  onCellsEdit?: (edits: DataGridCellEdit<T>[]) => void;
  /** Called when a row is dragged, or moved with Alt+Up / Alt+Down. Apply it with reorderRows(rows, move). */
  onRowReorder?: (move: DataGridRowMove) => void;
  /** Filled with getCsv(), downloadCsv() and downloadExcel(). Create it with useRef<DataGridApi>(null). */
  apiRef?: { current: DataGridApi | null };
  /** Tree data: a row's children. Rows with children get an expand toggle. */
  getSubRows?: (row: T) => readonly T[] | undefined;
  /** Master-detail: content shown under a row when it's expanded. */
  renderDetail?: (row: T) => ReactNode;
  /** Initial sort, e.g. [{ id: "createdAt", desc: true }]. */
  defaultSorting?: SortingState;
  className?: string;
}

const rowHeights = { compact: 32, standard: 40, comfortable: 48 } as const;
const SELECT_ID = "__select";
const REORDER_ID = "__reorder";
/** The columns the grid adds itself: they have no data, so copy, export and the column menu skip them. */
type Rect = { r0: number; r1: number; c0: number; c1: number };

/**
 * The block a fill drag covers: the source, grown along one axis towards the
 * pointer (the axis it has gone further along), never in two directions at once.
 */
function fillTarget(source: Rect, row: number, col: number): Rect {
  const dRow = row > source.r1 ? row - source.r1 : row < source.r0 ? row - source.r0 : 0;
  const dCol = col > source.c1 ? col - source.c1 : col < source.c0 ? col - source.c0 : 0;
  if (dRow === 0 && dCol === 0) return source;
  if (Math.abs(dRow) >= Math.abs(dCol)) return { ...source, r0: dRow < 0 ? row : source.r0, r1: dRow > 0 ? row : source.r1 };
  return { ...source, c0: dCol < 0 ? col : source.c0, c1: dCol > 0 ? col : source.c1 };
}

const isSystemColumn = (id: string) => id === SELECT_ID || id === REORDER_ID;
const RESIZE_STEP = 16;
const MAX_SELECT_OPTIONS = 200;
const numberFormat = new Intl.NumberFormat();

const toSelection = (ids?: readonly string[]): RowSelectionState =>
  Object.fromEntries((ids ?? []).map((id) => [id, true]));
const selectedIds = (state: RowSelectionState) => Object.keys(state).filter((id) => state[id]);
const resolve = <S,>(updater: Updater<S>, old: S): S =>
  typeof updater === "function" ? (updater as (old: S) => S)(old) : updater;
const metaOf = <T,>(column: Column<T, unknown>) => (column.columnDef.meta ?? {}) as DataGridColumnMeta;
const nameOf = <T,>(column: Column<T, unknown>) =>
  typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
const isPrintable = (e: KeyboardEvent) => e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
/**
 * The first key of an IME composition (Japanese, Chinese, Korean...) arrives
 * as "Process" / keyCode 229, with no character. It still means "start typing".
 */
const isComposing = (e: KeyboardEvent) => e.key === "Process" || e.nativeEvent.isComposing || e.keyCode === 229;

function SelectBox(props: { label: string; checked: boolean; indeterminate?: boolean; onToggle: () => void }) {
  return (
    <input
      type="checkbox"
      tabIndex={-1} // the cell holds focus; Space on the cell toggles
      aria-label={props.label}
      checked={props.checked}
      ref={(el) => {
        if (el) el.indeterminate = !!props.indeterminate;
      }}
      onChange={props.onToggle}
      // Keep focus on the grid cell rather than the checkbox, or Space would toggle twice.
      onMouseDown={(e) => e.preventDefault()}
      className="size-4 cursor-pointer accent-[var(--rd-color-action-primary)]"
    />
  );
}

function SortIcon({ direction, index }: { direction: false | "asc" | "desc"; index?: number }) {
  if (!direction) return null;
  return (
    <span aria-hidden="true" className="inline-flex items-center text-[var(--rd-color-action-primary)]">
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none">
        <path
          d={direction === "asc" ? "M8 12V4M4.5 7.5L8 4l3.5 3.5" : "M8 4v8M4.5 8.5L8 12l3.5-3.5"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {index !== undefined && <span className="text-[10px] font-semibold">{index + 1}</span>}
    </span>
  );
}

function ExpandToggle({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1} // the cell holds focus; Enter or the arrow keys toggle
      aria-label={expanded ? "Collapse" : "Expand"}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onMouseDown={(e) => e.preventDefault()}
      className="me-1 inline-flex size-5 flex-none items-center justify-center rounded text-[var(--rd-color-text-muted)] hover:bg-[var(--rd-color-surface-subtle)]"
    >
      <svg viewBox="0 0 16 16" className={cx("size-3.5 transition-transform", expanded && "rotate-90")} fill="none" aria-hidden="true">
        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** A visible line of the grid body: a data or group row, or the detail panel under an expanded row. */
type Item<T> = { kind: "row"; row: Row<T> } | { kind: "detail"; row: Row<T> };

function pinStyle<T>(column: Column<T, unknown>, z = 1): CSSProperties {
  if (column.getIsPinned() !== "left") return {};
  return { position: "sticky", left: column.getStart("left"), zIndex: z };
}

const widgetInput =
  "h-7 w-full min-w-0 rounded-[calc(var(--rd-radius-control)-2px)] border border-[var(--rd-color-border-default)] " +
  "bg-[var(--rd-color-surface-default)] px-2 text-sm text-[var(--rd-color-text-default)] outline-none " +
  "focus:border-transparent focus:ring-2 focus:ring-[var(--rd-color-focus-ring)]";

export function DataGrid<T>({
  label,
  data,
  columns,
  getRowId,
  density = dataGridDefaults.density,
  height = dataGridDefaults.height,
  virtualized = dataGridDefaults.virtualized,
  sortable = dataGridDefaults.sortable,
  selectionMode = dataGridDefaults.selectionMode,
  selectedRowIds,
  defaultSelectedRowIds,
  onSelectionChange,
  onFilteredDataChange,
  globalFilter,
  resizableColumns = dataGridDefaults.resizableColumns,
  pinnedColumns,
  showColumnFilters = dataGridDefaults.showColumnFilters,
  pageSize,
  onCellEdit,
  onCellsEdit,
  rangeSelection = dataGridDefaults.rangeSelection,
  apiRef,
  serverSide = dataGridDefaults.serverSide,
  rowCount,
  onQueryChange,
  queryDelay = dataGridDefaults.queryDelay,
  columnMenu = dataGridDefaults.columnMenu,
  fillHandle = dataGridDefaults.fillHandle,
  rowReorder = dataGridDefaults.rowReorder,
  onRowReorder,
  isLoading = dataGridDefaults.isLoading,
  emptyMessage = dataGridDefaults.emptyMessage,
  onRowAction,
  defaultSorting,
  groupBy,
  defaultExpanded = dataGridDefaults.defaultExpanded,
  getSubRows,
  renderDetail,
  detailHeight = dataGridDefaults.detailHeight,
  className,
}: DataGridProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting ?? []);
  const [expanded, setExpanded] = useState<ExpandedState>(defaultExpanded ? true : {});
  // The server can't group or nest rows for us, so those stay off in serverSide.
  const grouping = useMemo(() => (serverSide ? [] : [...(groupBy ?? [])]), [groupBy, serverSide]);
  const isTree = !!getSubRows && !serverSide;
  const isHierarchical = isTree || grouping.length > 0 || !!renderDetail;
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  // Pinning and hiding start from the props and are then changed from the column menu.
  const [pinned, setPinned] = useState<string[]>(() => [...(pinnedColumns ?? [])]);
  const pinnedKey = (pinnedColumns ?? []).join("\u0000");
  const pinnedMounted = useRef(false);
  useEffect(() => {
    if (pinnedMounted.current) setPinned(pinnedKey ? pinnedKey.split("\u0000") : []);
    pinnedMounted.current = true;
  }, [pinnedKey]);
  const [hidden, setHidden] = useState<string[]>([]);
  const columnVisibility = useMemo(() => Object.fromEntries(hidden.map((id) => [id, false])), [hidden]);
  const [menuCol, setMenuCol] = useState<string | null>(null);
  const [fill, setFill] = useState<{ source: Rect; target: Rect } | null>(null);
  const [gridFocused, setGridFocused] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<{ id: string; after: boolean } | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [innerSelection, setInnerSelection] = useState(() => toSelection(defaultSelectedRowIds));
  const rowSelection = useMemo(
    () => (selectedRowIds ? toSelection(selectedRowIds) : innerSelection),
    [selectedRowIds, innerSelection],
  );

  const hasSelection = selectionMode !== "none";
  const isMultiple = selectionMode === "multiple";
  const isPaged = pageSize !== undefined && pageSize > 0;
  // Rows can only be moved while they show in the order of your data.
  const canReorder =
    rowReorder && !serverSide && sorting.length === 0 && columnFilters.length === 0 && !globalFilter && grouping.length === 0 && !isTree;

  // New filters or a new sort order start again from page 1.
  useEffect(() => setPageIndex(0), [globalFilter, columnFilters, sorting]);

  // serverSide: tell the app what to fetch. Sort and page changes go out at
  // once; filter and search typing waits, so one keystroke isn't one request.
  const onQuery = useRef(onQueryChange);
  onQuery.current = onQueryChange;
  const sortKey = JSON.stringify(sorting);
  const filterKey = JSON.stringify([columnFilters, globalFilter ?? ""]);
  const previous = useRef({ sortKey, filterKey });
  useEffect(() => {
    if (!serverSide) return;
    const changed = previous.current;
    const filtersMoved = changed.filterKey !== filterKey;
    previous.current = { sortKey, filterKey };
    // A new sort or filter starts at page 1: the reset above re-renders and sends it then.
    if ((filtersMoved || changed.sortKey !== sortKey) && pageIndex !== 0) return;
    const send = () => {
      onQuery.current?.({
        sorting: sorting.map(({ id, desc }) => ({ id, desc })),
        filters: columnFilters.map(({ id, value }) => ({ id, value: Array.isArray(value) ? value.map(String) : String(value ?? "") })),
        search: globalFilter ?? "",
        pageIndex,
        pageSize: pageSize ?? 0,
      });
    };
    if (!filtersMoved || queryDelay <= 0) {
      send(); // not `return send()`: an async handler returns a promise, which React would call as cleanup
      return;
    }
    const timer = setTimeout(send, queryDelay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sorting and columnFilters are covered by their keys
  }, [serverSide, sortKey, filterKey, pageIndex, pageSize, queryDelay]);

  const allColumns = useMemo<ColumnDef<T, any>[]>(() => {
    // meta.format renders the cell text unless the column brings its own cell.
    const formatted = columns.map((c) => {
      const format = (c.meta as DataGridColumnMeta | undefined)?.format;
      if (!format || c.cell) return c;
      const cell = (ctx: { getValue: () => unknown }) => (ctx.getValue() == null ? "" : format(ctx.getValue()));
      return { ...c, cell, aggregatedCell: c.aggregatedCell ?? cell }; // group totals are formatted too
    });
    const lead: ColumnDef<T, any>[] = [];
    if (rowReorder) {
      lead.push({
        id: REORDER_ID,
        size: 40,
        minSize: 40,
        enableSorting: false,
        enableResizing: false,
        enableGlobalFilter: false,
        meta: { filter: false } satisfies DataGridColumnMeta,
        header: () => <span className="sr-only">Reorder</span>,
        cell: () => null, // the handle is drawn with the row, where it can see the drag state
      });
    }
    const select: ColumnDef<T, any> = {
      id: SELECT_ID,
      size: 44,
      minSize: 44,
      enableSorting: false,
      enableResizing: false,
      enableGlobalFilter: false,
      meta: { filter: false } satisfies DataGridColumnMeta,
      header: () => (isMultiple ? null : <span className="sr-only">Selection</span>), // multiple: rendered with live state below
      cell: ({ row }) => <SelectBox label="Select row" checked={row.getIsSelected()} onToggle={() => row.toggleSelected()} />,
    };
    if (hasSelection) lead.push(select);
    return [...lead, ...formatted];
  }, [columns, hasSelection, isMultiple, rowReorder]);

  const table = useReactTable<T>({
    data: data as T[],
    columns: allColumns,
    getRowId,
    getSubRows: (serverSide ? undefined : getSubRows) as ((row: T) => T[] | undefined) | undefined,
    state: {
      sorting,
      grouping,
      expanded,
      rowSelection,
      columnSizing,
      columnFilters,
      globalFilter: globalFilter ?? "",
      columnVisibility,
      columnPinning: { left: [...(rowReorder ? [REORDER_ID] : []), ...(hasSelection ? [SELECT_ID] : []), ...pinned] },
      ...(isPaged ? { pagination: { pageIndex, pageSize } } : {}),
    },
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: (updater) => setPageIndex(resolve(updater, { pageIndex, pageSize: pageSize ?? 0 }).pageIndex),
    onRowSelectionChange: (updater) => {
      // Selecting a group row selects its rows; the group's own id isn't data, so leave it out.
      // With serverSide the other pages' rows aren't loaded, but their selection stays.
      const byId = table.getCoreRowModel().rowsById;
      const next = Object.fromEntries(Object.entries(resolve(updater, rowSelection)).filter(([id]) => serverSide || id in byId));
      if (!selectedRowIds) setInnerSelection(next);
      onSelectionChange?.(selectedIds(next));
    },
    onExpandedChange: setExpanded,
    getRowCanExpand: (row) => row.subRows.length > 0 || (!!renderDetail && !row.getIsGrouped()),
    autoResetExpanded: false,
    filterFromLeafRows: true, // tree data: keep a parent when one of its children matches
    globalFilterFn: searchFilter,
    enableSorting: sortable,
    // TanStack sorts number columns descending first; start every column
    // ascending so a first click means the same thing everywhere.
    sortDescFirst: false,
    isMultiSortEvent: (e) => !!(e as { shiftKey?: boolean })?.shiftKey,
    enableRowSelection: hasSelection,
    enableMultiRowSelection: isMultiple,
    enableColumnResizing: resizableColumns,
    columnResizeMode: "onChange",
    autoResetPageIndex: false,
    // Group rows total a column only when it asks to (aggregationFn: "sum", "mean"...):
    // TanStack's "auto" would add up every number column, ages included.
    defaultColumn: { size: 160, minSize: 60, maxSize: 800, filterFn: columnFilter, aggregationFn: undefined as never },
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    // serverSide: the rows arrive already filtered, sorted and cut to a page.
    ...(serverSide
      ? { manualFiltering: true, manualSorting: true, manualPagination: true, pageCount: isPaged ? Math.max(1, Math.ceil((rowCount ?? data.length) / pageSize)) : 1 }
      : {
          getFilteredRowModel: filteredRowModel<T>(),
          getSortedRowModel: sortedRowModel<T>(),
          ...(isPaged ? { getPaginationRowModel: getPaginationRowModel() } : {}),
        }),
  });

  const rows = table.getRowModel().rows; // this page (or everything when not paged), expanded rows included
  const filteredRows = table.getPrePaginationRowModel().rows;
  // The data rows that pass the filters, in display order (children after
  // their parent, collapsed or not), without group rows.
  const sorted = table.getSortedRowModel().rows;
  const dataRows = useMemo(() => {
    if (!isTree && !grouping.length) return sorted;
    const out: Row<T>[] = [];
    const walk = (list: Row<T>[]) => {
      for (const r of list) {
        if (!r.getIsGrouped()) out.push(r);
        walk(r.subRows);
      }
    };
    walk(sorted);
    return out;
  }, [isTree, grouping, sorted]);

  // Each expanded row with a detail panel adds a line under it.
  const items = useMemo<Item<T>[]>(() => {
    if (!renderDetail) return rows.map((row) => ({ kind: "row", row }));
    return rows.flatMap((row) =>
      row.getIsExpanded() && !row.getIsGrouped() ? [{ kind: "row", row } as const, { kind: "detail", row } as const] : [{ kind: "row", row } as const],
    );
  }, [rows, renderDetail, expanded]); // expanded: which rows show their detail

  // Lets the app show counts and totals for what the grid's own search and
  // filters leave. A ref keeps an inline callback from re-firing every render.
  const onFilteredData = useRef(onFilteredDataChange);
  onFilteredData.current = onFilteredDataChange;
  useEffect(() => {
    onFilteredData.current?.(dataRows.map((r) => r.original));
  }, [dataRows]);
  const total = serverSide ? Math.max(rowCount ?? data.length, 0) : filteredRows.length;
  const pageCount = isPaged ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const rowOffset = isPaged ? pageIndex * pageSize : 0;
  const headers = table.getHeaderGroups()[0].headers;
  const leafColumns = table.getVisibleLeafColumns();
  const colCount = leafColumns.length;
  const rowHeight = rowHeights[density];
  const totalWidth = table.getTotalSize();
  const isEmpty = rows.length === 0;
  // The column that holds expand toggles and tree indentation: the first after the checkboxes.
  const expanderCol = (rowReorder ? 1 : 0) + (hasSelection ? 1 : 0);
  const lineHeight = (item: Item<T>) => (item.kind === "detail" ? detailHeight : rowHeight);

  // Grid rows: 0 is the header, 1 the filter row (if shown), then data.
  const bodyStart = showColumnFilters ? 2 : 1;
  const headerBlock = rowHeight * bodyStart;

  const canEdit = (column: Column<T, unknown>) => (!!onCellEdit || !!onCellsEdit) && !!metaOf(column).editable;
  const anyEditable = (!!onCellEdit || !!onCellsEdit) && leafColumns.some((c) => metaOf(c).editable);

  // "Select all" acts on every row that passes the filters, across pages.
  // Memoized: scanning 100k rows on every keystroke-driven render adds up.
  const { allVisibleSelected, someVisibleSelected } = useMemo(() => {
    if (!hasSelection || dataRows.length === 0) return { allVisibleSelected: false, someVisibleSelected: false };
    let count = 0;
    for (const r of dataRows) if (rowSelection[r.id]) count++;
    return { allVisibleSelected: count === dataRows.length, someVisibleSelected: count > 0 && count < dataRows.length };
  }, [hasSelection, dataRows, rowSelection]);
  const selectAllVisible = (value: boolean) => {
    const next = { ...rowSelection };
    for (const r of dataRows) next[r.id] = value;
    table.setRowSelection(next);
  };

  // Options for "select" filters: the column's distinct values, before filtering.
  const preFiltered = table.getPreFilteredRowModel().rows;
  const selectOptions = useMemo(() => {
    const out: Record<string, string[]> = {};
    if (!showColumnFilters) return out;
    for (const column of leafColumns) {
      if (metaOf(column).filter !== "select" && metaOf(column).filter !== "set") continue;
      const given = metaOf(column).filterOptions;
      if (given) {
        out[column.id] = [...given];
        continue;
      }
      const seen = new Set<string>();
      for (const r of preFiltered) {
        const v = r.getValue(column.id);
        if (v !== null && v !== undefined && v !== "") seen.add(String(v));
        if (seen.size > MAX_SELECT_OPTIONS) break;
      }
      out[column.id] = [...seen].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }
    return out;
  }, [showColumnFilters, leafColumns, preFiltered]);

  // --- Virtualization ------------------------------------------------------
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (items[i] ? lineHeight(items[i]) : rowHeight),
    overscan: 8,
    enabled: virtualized,
    // The sticky header (and filter row) sit above the rows: offset by them,
    // and keep scrolled-to rows from hiding underneath.
    scrollMargin: headerBlock,
    scrollPaddingStart: headerBlock,
    // Lets rows render before the scroll element is measured (SSR, tests).
    initialRect: { width: 0, height },
  });
  // Detail panels span the visible width, not the full column width, so they
  // stay readable in a grid that scrolls sideways.
  const [viewWidth, setViewWidth] = useState(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!renderDetail || !el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setViewWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, [renderDetail]);

  // Detail panels are taller than rows: re-measure when they open or close.
  const detailCount = renderDetail ? items.length - rows.length : 0;
  useEffect(() => virtualizer.measure(), [rowHeight, headerBlock, detailHeight, detailCount, virtualizer]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [pageIndex]);

  // Where each line starts, when lines can differ in height (detail panels).
  const tops = useMemo(() => {
    if (!detailCount) return null;
    const out: number[] = [];
    let y = 0;
    for (const item of items) {
      out.push(y);
      y += lineHeight(item);
    }
    out.push(y);
    return out;
  }, [items, detailCount, rowHeight, detailHeight]);
  const bodyHeight = tops ? tops[tops.length - 1] : items.length * rowHeight;

  const rendered = virtualized
    ? virtualizer.getVirtualItems().map((v) => ({ index: v.index, top: v.start - headerBlock }))
    : items.map((_, index) => ({ index, top: tops ? tops[index] : index * rowHeight }));

  // --- Focus (roving tabindex) and editing ---------------------------------
  const [active, setActive] = useState({ row: bodyStart, col: 0 });
  // The cell most recently asked for. A pending focus waits until the rendered
  // `active` is this one: an effect left over from an earlier render must not
  // use up the request while the state it was made for is still on its way.
  const latestActive = useRef(active);
  const setActiveCell = (cell: { row: number; col: number }) => {
    latestActive.current = cell;
    setActive(cell);
  };
  const [edit, setEdit] = useState<{ row: number; col: number; draft: string; invalid: boolean } | null>(null);
  const focusPending = useRef(false);
  // A block of cells runs from the anchor to the focused cell.
  const [anchor, setAnchor] = useState<{ row: number; col: number } | null>(null);
  /** Where a mouse drag began, while the button is held. */
  const dragStart = useRef<{ row: number; col: number } | null>(null);
  const [status, setStatus] = useState("");
  useEffect(() => {
    const stop = () => (dragStart.current = null);
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, []);
  /** A touch started on the already-active cell: lifting the finger edits it. */
  const tappedActive = useRef(false);
  const lastRow = isEmpty ? bodyStart - 1 : bodyStart + items.length - 1;
  const activeRow = Math.min(active.row, lastRow);
  const activeCol = Math.min(active.col, colCount - 1);
  const itemAt = (gridRow: number) => (gridRow >= bodyStart ? items[gridRow - bodyStart] : undefined);
  /** The data or group row on a grid line; undefined for the header, filters and detail panels. */
  const rowAt = (gridRow: number) => {
    const item = itemAt(gridRow);
    return item?.kind === "row" ? item.row : undefined;
  };
  // A detail panel is one cell wide: any column lands on it.
  const cellEl = (row: number, col: number) =>
    scrollRef.current?.querySelector<HTMLElement>(`[data-cell="${row}:${itemAt(row)?.kind === "detail" ? 0 : col}"]`) ?? null;
  /** Does this cell hold the row's expand toggle? */
  const isToggleCell = (row: Row<T>, col: number) => {
    if (!row.getCanExpand()) return false;
    if (row.getIsGrouped()) return leafColumns[col]?.id === row.groupingColumnId;
    return col === expanderCol;
  };

  // The block, once it spans more than the focused cell. Only body cells can be in one.
  const anchorRow = anchor ? Math.min(anchor.row, lastRow) : -1;
  const anchorCol = anchor ? Math.min(anchor.col, colCount - 1) : -1;
  const rect =
    rangeSelection && anchor && anchorRow >= bodyStart && activeRow >= bodyStart && (anchorRow !== activeRow || anchorCol !== activeCol)
      ? {
          r0: Math.min(anchorRow, activeRow),
          r1: Math.max(anchorRow, activeRow),
          c0: Math.min(anchorCol, activeCol),
          c1: Math.max(anchorCol, activeCol),
        }
      : null;
  const rectCells = rect ? (rect.r1 - rect.r0 + 1) * (rect.c1 - rect.c0 + 1) : 0;
  // A paste selects the cells it changed; its own message should be the one that's read out.
  const keepStatus = useRef(false);
  useEffect(() => {
    if (keepStatus.current) keepStatus.current = false;
    else setStatus(rectCells ? `${numberFormat.format(rectCells)} cells selected` : "");
  }, [rectCells]);

  const moveTo = (row: number, col: number, extend = false) => {
    // Shift extends a block from where it started; it can't reach into the header.
    const extending = extend && rangeSelection && activeRow >= bodyStart;
    const r = Math.max(extending ? bodyStart : 0, Math.min(row, lastRow));
    const c = Math.max(0, Math.min(col, colCount - 1));
    setAnchor(extending ? (anchor ? { row: anchorRow, col: anchorCol } : { row: activeRow, col: activeCol }) : null);
    setActiveCell({ row: r, col: c });
    focusPending.current = true;
    if (virtualized && r >= bodyStart) virtualizer.scrollToIndex(r - bodyStart, { align: "auto" });
  };

  // Focus the active cell once it's rendered; with virtualization that can
  // take a render or two after scrolling. Skipped while an editor is open.
  useEffect(() => {
    if (!focusPending.current || edit || active !== latestActive.current) return;
    const el = cellEl(activeRow, activeCol);
    if (!el) return;
    el.focus({ preventScroll: virtualized });
    el.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    focusPending.current = false;
  });

  const activeIsRendered = activeRow < bodyStart || rendered.some((r) => r.index === activeRow - bodyStart);
  const isTabStop = (row: number, col: number) => {
    if (!activeIsRendered) return row === 0 && col === activeCol; // scrolled away: fall back to the header
    return row === activeRow && (col === activeCol || itemAt(row)?.kind === "detail");
  };

  const startEdit = (row: number, col: number, initial?: string) => {
    const r = rowAt(row);
    const column = leafColumns[col];
    if (!r || r.getIsGrouped() || !column || !canEdit(column)) return false;
    const current = r.getValue(column.id);
    setEdit({ row, col, draft: initial ?? (current === null || current === undefined ? "" : String(current)), invalid: false });
    return true;
  };

  /** Saves the edit. Returns false (and keeps editing) if the value is invalid. */
  const commitEdit = (refocus: boolean) => {
    if (!edit) return true;
    const r = rowAt(edit.row);
    const column = leafColumns[edit.col];
    let value: unknown = edit.draft;
    if (metaOf(column).editor === "number") {
      const n = Number(edit.draft);
      if (edit.draft.trim() === "" || !Number.isFinite(n)) {
        setEdit({ ...edit, invalid: true });
        return false;
      }
      value = n;
    }
    if (r) {
      const change = { rowId: r.id, columnId: column.id, value, row: r.original };
      // One edit goes to onCellEdit; an app that only takes batches gets a batch of one.
      if (onCellEdit) onCellEdit(change);
      else onCellsEdit?.([change]);
    }
    setEdit(null);
    focusPending.current = refocus;
    return true;
  };

  const cancelEdit = (refocus: boolean) => {
    setEdit(null);
    focusPending.current = refocus;
  };

  const focusFilter = (col: number, append?: string) => {
    const column = leafColumns[col];
    const widget = cellEl(1, col)?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>("input, select, button[data-widget]");
    if (!widget) return false;
    if (widget instanceof HTMLButtonElement) {
      widget.focus();
      widget.click(); // a set filter opens its checklist
      return true;
    }
    if (append !== undefined && widget instanceof HTMLInputElement) {
      column.setFilterValue(`${(column.getFilterValue() as string | undefined) ?? ""}${append}`);
    }
    widget.focus();
    return true;
  };

  const resizeActive = (delta: number) => {
    const column = leafColumns[activeCol];
    if (!column?.getCanResize()) return;
    const { minSize = 60, maxSize = 800 } = column.columnDef;
    const size = Math.max(minSize, Math.min(maxSize, column.getSize() + delta));
    table.setColumnSizing((old) => ({ ...old, [column.id]: size }));
  };

  // --- Copy, paste and export ----------------------------------------------
  const isWidget = (el: HTMLElement) => el.matches("input:not([type=checkbox]), select, textarea, [data-widget]");
  /** The text a cell shows, which is what a spreadsheet user expects to copy. */
  const displayText = (row: Row<T>, column: Column<T, unknown>) => {
    const value = row.getValue(column.id);
    if (value === null || value === undefined) return "";
    const format = metaOf(column).format;
    return format ? format(value) : value instanceof Date ? value.toISOString() : String(value);
  };
  const dataLinesFrom = (from: number, to = lastRow) => {
    const lines: number[] = [];
    for (let g = Math.max(from, bodyStart); g <= to; g++) {
      const r = rowAt(g);
      if (r && !r.getIsGrouped()) lines.push(g);
    }
    return lines;
  };
  const dataColsFrom = (from: number, to = colCount - 1) => {
    const cols: number[] = [];
    for (let c = from; c <= to; c++) if (!isSystemColumn(leafColumns[c].id)) cols.push(c);
    return cols;
  };

  const onCopy = (e: ClipboardEvent<HTMLDivElement>) => {
    if (!rangeSelection || !e.currentTarget.contains(e.target as Node) || isWidget(e.target as HTMLElement) || activeRow < bodyStart) return;
    const lines = dataLinesFrom(rect ? rect.r0 : activeRow, rect ? rect.r1 : activeRow);
    const cols = dataColsFrom(rect ? rect.c0 : activeCol, rect ? rect.c1 : activeCol);
    if (!lines.length || !cols.length) return;
    const text = toTsv(lines.map((g) => cols.map((c) => displayText(rowAt(g)!, leafColumns[c]))));
    e.clipboardData.setData("text/plain", text);
    e.preventDefault();
    const n = lines.length * cols.length;
    setStatus(`${numberFormat.format(n)} ${n === 1 ? "cell" : "cells"} copied`);
  };

  /** Hands changed cells to the app: one batch when it takes batches, else one call per cell. */
  const applyEdits = (edits: DataGridCellEdit<T>[]) => {
    if (!edits.length) return;
    if (onCellsEdit) onCellsEdit(edits);
    else edits.forEach((edit) => onCellEdit?.(edit));
  };

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (!rangeSelection || (!onCellEdit && !onCellsEdit) || !e.currentTarget.contains(e.target as Node) || isWidget(e.target as HTMLElement) || activeRow < bodyStart) return;
    const matrix = parseTsv(e.clipboardData.getData("text/plain"));
    if (!matrix.length) return;
    e.preventDefault();
    const single = matrix.length === 1 && matrix[0].length === 1;
    // One copied value fills a selected block; anything bigger pastes from the block's top-left cell.
    const lines = dataLinesFrom(rect ? rect.r0 : activeRow, single && rect ? rect.r1 : lastRow);
    const cols = dataColsFrom(rect ? rect.c0 : activeCol, single && rect ? rect.c1 : colCount - 1);
    if (!lines.length || !cols.length) return;
    const edits: DataGridCellEdit<T>[] = [];
    let skipped = 0;
    const rowCount = single && rect ? lines.length : Math.min(matrix.length, lines.length);
    for (let i = 0; i < rowCount; i++) {
      const r = rowAt(lines[i])!;
      const colCountHere = single && rect ? cols.length : Math.min(matrix[i].length, cols.length);
      for (let j = 0; j < colCountHere; j++) {
        const column = leafColumns[cols[j]];
        const text = single ? matrix[0][0] : matrix[i][j];
        if (!canEdit(column)) {
          skipped++;
          continue;
        }
        let value: unknown = text;
        if (metaOf(column).editor === "number") {
          const n = Number(text);
          if (text.trim() === "" || !Number.isFinite(n)) {
            skipped++;
            continue;
          }
          value = n;
        }
        edits.push({ rowId: r.id, columnId: column.id, value, row: r.original });
      }
    }
    applyEdits(edits);
    // Show what the paste covered.
    const lastLine = lines[Math.max(0, rowCount - 1)];
    const width = single && rect ? cols.length : Math.min(matrix.reduce((n, m) => Math.max(n, m.length), 0), cols.length);
    const lastCol = cols[Math.max(0, width - 1)];
    if (rowCount > 1 || width > 1) {
      keepStatus.current = true;
      setAnchor({ row: lines[0], col: cols[0] });
      setActiveCell({ row: lastLine, col: lastCol });
    }
    focusPending.current = true;
    setStatus(
      `${numberFormat.format(edits.length)} ${edits.length === 1 ? "cell" : "cells"} pasted` +
        (skipped ? `, ${numberFormat.format(skipped)} skipped` : ""),
    );
  };

  const exportData = (options?: DataGridExportOptions) => {
    const columns = leafColumns.filter((c) => !isSystemColumn(c.id));
    const rows = options?.scope === "selected" ? dataRows.filter((r) => rowSelection[r.id]) : dataRows;
    const values = rows.map((r) =>
      columns.map<ExportValue>((c) => {
        const v = r.getValue(c.id);
        return v === null || v === undefined || typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v instanceof Date
          ? (v as ExportValue)
          : String(v);
      }),
    );
    return { headers: columns.map(nameOf), values };
  };
  const exportName = (options?: DataGridExportOptions) => options?.fileName || label.replace(/[\\/:*?"<>|]+/g, "-").trim() || "export";
  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      getCsv: (options) => {
        const { headers, values } = exportData(options);
        return toCsv(headers, values, options?.sanitize ?? true);
      },
      downloadCsv: (options) => {
        const { headers, values } = exportData(options);
        download(toCsv(headers, values, options?.sanitize ?? true), `${exportName(options)}.csv`, "text/csv;charset=utf-8");
      },
      downloadExcel: (options) => {
        const { headers, values } = exportData(options);
        download(
          toXlsx(label, headers, values),
          `${exportName(options)}.xlsx`,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
      },
    };
    return () => {
      apiRef.current = null;
    };
  });

  // --- Fill ------------------------------------------------------------------
  const canFill = fillHandle && rangeSelection && (!!onCellEdit || !!onCellsEdit);

  /**
   * Writes the cells in `target` that lie outside `source`, continuing the
   * source's values along the one axis the target grows in. `series` counts
   * numbers up; without it the source just repeats (Ctrl+D, Ctrl+R).
   */
  const applyFill = (source: Rect, target: Rect, series: boolean) => {
    const down = target.r1 > source.r1;
    const up = target.r0 < source.r0;
    const right = target.c1 > source.c1;
    const left = target.c0 < source.c0;
    if (!down && !up && !right && !left) return;
    const edits: DataGridCellEdit<T>[] = [];
    let skipped = 0;
    const write = (line: number, col: number, value: unknown) => {
      const r = rowAt(line)!;
      const column = leafColumns[col];
      if (!canEdit(column)) {
        skipped++;
        return;
      }
      let next = value;
      if (metaOf(column).editor === "number") {
        const n = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
        if (!Number.isFinite(n)) {
          skipped++;
          return;
        }
        next = n;
      } else next = value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value);
      edits.push({ rowId: r.id, columnId: column.id, value: next, row: r.original });
    };
    if (down || up) {
      const sourceLines = dataLinesFrom(source.r0, source.r1);
      const newLines = down ? dataLinesFrom(source.r1 + 1, target.r1) : dataLinesFrom(target.r0, source.r0 - 1).reverse();
      for (const c of dataColsFrom(source.c0, source.c1)) {
        const values = sourceLines.map((g) => rowAt(g)!.getValue(leafColumns[c].id));
        const next = extendValues(down ? values : values.reverse(), newLines.length, series);
        newLines.forEach((g, k) => write(g, c, next[k]));
      }
    } else {
      const sourceCols = dataColsFrom(source.c0, source.c1);
      const newCols = right ? dataColsFrom(source.c1 + 1, target.c1) : dataColsFrom(target.c0, source.c0 - 1).reverse();
      for (const g of dataLinesFrom(source.r0, source.r1)) {
        const row = rowAt(g)!;
        const values = sourceCols.map((c) => row.getValue(leafColumns[c].id));
        const next = extendValues(right ? values : values.reverse(), newCols.length, series);
        newCols.forEach((c, k) => write(g, c, next[k]));
      }
    }
    applyEdits(edits);
    // Select what was filled, and say how it went.
    keepStatus.current = true;
    setAnchor({ row: target.r0, col: target.c0 });
    setActiveCell({ row: target.r1, col: target.c1 });
    focusPending.current = true;
    setStatus(
      `${numberFormat.format(edits.length)} ${edits.length === 1 ? "cell" : "cells"} filled` +
        (skipped ? `, ${numberFormat.format(skipped)} skipped` : ""),
    );
  };

  /** Ctrl+D / Ctrl+R: copy the top row (or the left column) of the selection across it. With no selection, copy from the cell above (or to the left). */
  const fillCommand = (direction: "down" | "right") => {
    const r0 = rect ? rect.r0 : direction === "down" ? activeRow - 1 : activeRow;
    const r1 = rect ? rect.r1 : activeRow;
    const c0 = rect ? rect.c0 : direction === "right" ? activeCol - 1 : activeCol;
    const c1 = rect ? rect.c1 : activeCol;
    if (r0 < bodyStart || c0 < 0) return;
    if (direction === "down" && r1 > r0) applyFill({ r0, r1: r0, c0, c1 }, { r0, r1, c0, c1 }, false);
    if (direction === "right" && c1 > c0) applyFill({ r0, r1, c0, c1: c0 }, { r0, r1, c0, c1 }, false);
  };

  // Dragging the handle: the target follows the pointer; letting go fills.
  const commitFill = useRef<() => void>(() => {});
  commitFill.current = () => {
    const current = fill;
    setFill(null);
    if (current) applyFill(current.source, current.target, true);
  };
  const filling = fill !== null;
  useEffect(() => {
    if (!filling) return;
    const pointer = { x: 0, y: 0, moved: false };
    const track = () => {
      if (!pointer.moved) return;
      const cell = document.elementFromPoint(pointer.x, pointer.y)?.closest<HTMLElement>("[data-cell]");
      const at = cell && /^(\d+):(\d+)$/.exec(cell.dataset.cell ?? "");
      if (!at) return;
      const row = Math.max(bodyStart, Math.min(Number(at[1]), lastRow));
      setFill((f) => (f ? { source: f.source, target: fillTarget(f.source, row, Number(at[2])) } : f));
    };
    const onMove = (e: MouseEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.moved = true;
      track();
    };
    const onUp = () => commitFill.current();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setFill(null);
    };
    // Near the edge of the grid, keep scrolling so a long fill can reach its end.
    const scroller = scrollRef.current;
    const timer = setInterval(() => {
      if (!scroller || !pointer.moved) return;
      const box = scroller.getBoundingClientRect();
      const edge = 28;
      if (pointer.y > box.bottom - edge) scroller.scrollTop += 24;
      else if (pointer.y < box.top + headerBlock + edge) scroller.scrollTop -= 24;
      if (pointer.x > box.right - edge) scroller.scrollLeft += 24;
      else if (pointer.x < box.left + edge) scroller.scrollLeft -= 24;
      track();
    }, 40);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(timer);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs for the length of one drag
  }, [filling]);

  // --- Column menu and row reorder ------------------------------------------
  const rowName = (row: Row<T>) => {
    const column = leafColumns.find((c) => !isSystemColumn(c.id));
    return (column && displayText(row, column)) || row.id;
  };
  const dataColumnCount = leafColumns.filter((c) => !isSystemColumn(c.id)).length;
  const hiddenColumns = table
    .getAllLeafColumns()
    .filter((c) => hidden.includes(c.id))
    .map((c) => ({ id: c.id, name: nameOf(c) }));

  const onMenuAction = (column: Column<T, unknown>, action: ColumnMenuAction) => {
    const name = nameOf(column);
    if (action === "asc" || action === "desc") {
      setSorting([{ id: column.id, desc: action === "desc" }]);
      setStatus(`Sorted ${name} ${action === "asc" ? "ascending" : "descending"}`);
    } else if (action === "clear-sort") {
      setSorting((old) => old.filter((s) => s.id !== column.id));
      setStatus(`Cleared the sort on ${name}`);
    } else if (action === "pin") {
      setPinned((old) => [...old.filter((id) => id !== column.id), column.id]);
      setStatus(`${name} pinned to the left`);
    } else if (action === "unpin") {
      setPinned((old) => old.filter((id) => id !== column.id));
      setStatus(`${name} unpinned`);
    } else if (action === "reset-width") {
      column.resetSize();
      setStatus(`${name} width reset`);
    } else if (action === "hide") {
      setHidden((old) => [...old, column.id]);
      setStatus(`${name} hidden`);
    } else if (action.startsWith("show:")) {
      const id = action.slice(5);
      setHidden((old) => old.filter((x) => x !== id));
      setStatus(`${nameOf(table.getColumn(id) ?? column)} shown`);
    }
  };

  const moveRow = (row: Row<T>, delta: number) => {
    const from = row.index;
    const to = Math.max(0, Math.min(from + delta, data.length - 1));
    if (to === from) return;
    onRowReorder?.({ rowId: row.id, fromIndex: from, toIndex: to });
    setStatus(`Moved ${rowName(row)} to position ${numberFormat.format(to + 1)} of ${numberFormat.format(data.length)}`);
    moveTo(activeRow + delta, activeCol); // focus follows the row
  };

  const endDrag = () => {
    setDragId(null);
    setDrop(null);
  };
  const finishDrag = () => {
    if (dragId && drop) {
      const byId = table.getCoreRowModel().rowsById;
      const dragged = byId[dragId];
      const target = byId[drop.id];
      if (dragged && target) {
        const insertAt = target.index + (drop.after ? 1 : 0);
        const to = dragged.index < insertAt ? insertAt - 1 : insertAt;
        if (to !== dragged.index) {
          onRowReorder?.({ rowId: dragged.id, fromIndex: dragged.index, toIndex: to });
          setStatus(`Moved ${rowName(dragged)} to position ${numberFormat.format(to + 1)} of ${numberFormat.format(data.length)}`);
        }
      }
    }
    endDrag();
  };

  const pageRows = Math.max(1, Math.floor(height / rowHeight) - bodyStart);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Menus and pickers open in a popover outside the grid, but React still
    // sends their key events up to it: they are not the grid's keys.
    if (!e.currentTarget.contains(target)) return;

    // Keys inside a cell widget (editor, filter, menu button) belong to the
    // widget, except the ones that leave it.
    if (target.matches("input:not([type=checkbox]), select, textarea, [data-widget]")) {
      if (edit) {
        if (e.key === "Enter") {
          e.preventDefault();
          commitEdit(true);
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancelEdit(true);
        }
      } else if (e.key === "Escape" || (e.key === "Enter" && target.tagName === "INPUT")) {
        e.preventDefault();
        target.closest<HTMLElement>("[data-cell]")?.focus();
      }
      return;
    }

    const ctrl = e.ctrlKey || e.metaKey;
    const column = leafColumns[activeCol];
    const isHeader = activeRow === 0;
    const isFilterRow = showColumnFilters && activeRow === 1;
    const row = rowAt(activeRow);
    // Like a tree: in the toggle cell, Right opens a row and Left closes it.
    const onToggle = !!row && isToggleCell(row, activeCol);

    if (
      columnMenu &&
      isHeader &&
      column &&
      !isSystemColumn(column.id) &&
      (e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey) || (e.key === "ArrowDown" && e.altKey))
    ) {
      e.preventDefault();
      setMenuCol(column.id);
      return;
    }
    if (canFill && ctrl && !e.altKey && !e.shiftKey && activeRow >= bodyStart && /^[dr]$/i.test(e.key)) {
      e.preventDefault(); // Ctrl+D would bookmark the page and Ctrl+R reload it
      fillCommand(e.key.toLowerCase() === "d" ? "down" : "right");
      return;
    }
    if (rowReorder && row && !row.getIsGrouped() && e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      if (canReorder) moveRow(row, e.key === "ArrowUp" ? -1 : 1);
      return;
    }

    switch (e.key) {
      case "ArrowRight":
        if (e.altKey && isHeader) resizeActive(RESIZE_STEP);
        else if (onToggle && !e.shiftKey && !row.getIsExpanded()) row.toggleExpanded(true);
        else moveTo(activeRow, activeCol + 1, e.shiftKey);
        break;
      case "ArrowLeft":
        if (e.altKey && isHeader) resizeActive(-RESIZE_STEP);
        else if (onToggle && !e.shiftKey && row.getIsExpanded()) row.toggleExpanded(false);
        else moveTo(activeRow, activeCol - 1, e.shiftKey);
        break;
      case "ArrowDown":
        moveTo(activeRow + 1, activeCol, e.shiftKey);
        break;
      case "ArrowUp":
        moveTo(activeRow - 1, activeCol, e.shiftKey);
        break;
      case "Home":
        moveTo(ctrl ? 0 : activeRow, 0, e.shiftKey);
        break;
      case "End":
        moveTo(ctrl ? lastRow : activeRow, colCount - 1, e.shiftKey);
        break;
      case "PageDown":
        moveTo(activeRow + pageRows, activeCol, e.shiftKey);
        break;
      case "PageUp":
        moveTo(activeRow - pageRows, activeCol, e.shiftKey);
        break;
      case "F2":
        if (!row || !startEdit(activeRow, activeCol)) return;
        break;
      case "Enter":
      case " ":
        if (isHeader) {
          if (column.id === SELECT_ID && isMultiple) selectAllVisible(!allVisibleSelected);
          else if (column.getCanSort()) column.toggleSorting(undefined, e.shiftKey);
          else return;
        } else if (isFilterRow) {
          if (!focusFilter(activeCol)) return;
        } else if (row && e.key === "Enter" && (row.getIsGrouped() || (onToggle && !canEdit(column)))) {
          row.toggleExpanded();
        } else if (row && e.key === " " && hasSelection) {
          row.toggleSelected();
        } else if (row && e.key === "Enter" && canEdit(column)) {
          startEdit(activeRow, activeCol);
        } else if (row && e.key === "Enter" && onRowAction) {
          onRowAction(row.original);
        } else if (row && e.key === " " && canEdit(column)) {
          startEdit(activeRow, activeCol, " ");
        } else return;
        break;
      case "Escape":
        if (!anchor) return;
        setAnchor(null);
        break;
      case "a":
        if (ctrl && isMultiple) {
          selectAllVisible(true);
          break;
        }
        if (ctrl && rangeSelection && activeRow >= bodyStart) {
          // Without row checkboxes, Ctrl+A takes every cell.
          setAnchor({ row: bodyStart, col: 0 });
          setActiveCell({ row: lastRow, col: colCount - 1 });
          focusPending.current = true;
          if (virtualized) virtualizer.scrollToIndex(lastRow - bodyStart, { align: "auto" });
          break;
        }
      // fall through: a plain "a" is typing
      default:
        if (isComposing(e)) {
          // Open an empty editor and let the IME keep composing into it. Don't
          // preventDefault: that would cancel the composition.
          if (row && !isFilterRow) startEdit(activeRow, activeCol, "");
          else if (isFilterRow) focusFilter(activeCol);
          return;
        }
        if (!isPrintable(e)) return;
        if (isFilterRow) {
          if (!focusFilter(activeCol, e.key)) return;
        } else if (!(row && startEdit(activeRow, activeCol, e.key))) return;
    }
    e.preventDefault();
  };

  // --- Rendering -----------------------------------------------------------
  const cellFocus =
    "outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--rd-color-focus-ring)]";
  const align = (column: Column<T, unknown>) =>
    metaOf(column).align === "end" ? "justify-end text-end tabular-nums" : "";
  const rowStyle = { width: totalWidth, minWidth: "100%", height: rowHeight };

  return (
    <div
      className={cx(
        "relative overflow-hidden border border-[var(--rd-color-border-default)] rounded-[var(--rd-radius-overlay)] " +
          "bg-[var(--rd-color-surface-default)] text-sm text-[var(--rd-color-text-default)]",
        className,
      )}
    >
      <div
        role={isHierarchical ? "treegrid" : "grid"}
        aria-label={label}
        aria-rowcount={(isEmpty ? 1 : isPaged ? total : items.length) + bodyStart}
        aria-colcount={colCount}
        aria-multiselectable={isMultiple || undefined}
        aria-busy={isLoading || undefined}
        onKeyDown={onKeyDown}
        onCopy={onCopy}
        onPaste={onPaste}
        onFocus={() => setGridFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setGridFocused(false);
        }}
      >
        <div ref={scrollRef} className="relative overflow-auto" style={{ height }}>
          <div role="rowgroup" className="sticky top-0 z-[2]" style={{ width: totalWidth, minWidth: "100%" }}>
            {/* Header row */}
            <div
              role="row"
              aria-rowindex={1}
              className="flex border-b border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]"
              style={rowStyle}
            >
              {headers.map((header, col) => {
                const column = header.column;
                const sorted = column.getIsSorted();
                const canSort = column.getCanSort();
                return (
                  <div
                    key={header.id}
                    role="columnheader"
                    aria-colindex={col + 1}
                    aria-sort={canSort ? (sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none") : undefined}
                    data-cell={`0:${col}`}
                    tabIndex={isTabStop(0, col) ? 0 : -1}
                    onFocus={() => setActiveCell({ row: 0, col })}
                    onClick={canSort ? column.getToggleSortingHandler() : undefined}
                    className={cx(
                      "relative flex flex-none items-center gap-1 px-3 font-medium text-[var(--rd-color-text-muted)] select-none",
                      "bg-[var(--rd-color-surface-subtle)]",
                      canSort && "cursor-pointer hover:text-[var(--rd-color-text-default)]",
                      align(column),
                      cellFocus,
                    )}
                    style={{ width: header.getSize(), ...pinStyle(column, 3) }}
                  >
                    {column.id === SELECT_ID && isMultiple ? (
                      <SelectBox
                        label="Select all rows"
                        checked={allVisibleSelected}
                        indeterminate={someVisibleSelected}
                        onToggle={() => selectAllVisible(!allVisibleSelected)}
                      />
                    ) : (
                      <span className="truncate">{flexRender(column.columnDef.header, header.getContext())}</span>
                    )}
                    <SortIcon direction={sorted} index={sorting.length > 1 && sorted ? column.getSortIndex() : undefined} />
                    {columnMenu && !isSystemColumn(column.id) && (
                      // Stops clicks in the button and its popover from also sorting the column.
                      <span className="ms-auto flex" onClick={(e) => e.stopPropagation()}>
                        <ColumnMenu
                          name={nameOf(column)}
                          isOpen={menuCol === column.id}
                          onOpenChange={(open) => {
                            setMenuCol(open ? column.id : null);
                            if (!open) requestAnimationFrame(() => cellEl(0, col)?.focus()); // back to the header, not the menu button
                          }}
                          sorted={sorted}
                          canSort={canSort}
                          canPin
                          isPinned={pinned.includes(column.id)}
                          canHide={dataColumnCount > 1}
                          canResize={column.getCanResize()}
                          hidden={hiddenColumns}
                          onAction={(action) => onMenuAction(column, action)}
                        />
                      </span>
                    )}
                    {column.getCanResize() && (
                      <div
                        aria-hidden="true"
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onDoubleClick={() => column.resetSize()}
                        onClick={(e) => e.stopPropagation()} // don't sort when releasing a resize
                        data-resizing={column.getIsResizing() || undefined}
                        className={
                          "absolute inset-y-0 end-0 w-1.5 cursor-col-resize touch-none select-none " +
                          "hover:bg-[var(--rd-color-border-strong)] data-[resizing]:bg-[var(--rd-color-action-primary)]"
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Filter row */}
            {showColumnFilters && (
              <div
                role="row"
                aria-rowindex={2}
                className="flex border-b border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]"
                style={rowStyle}
              >
                {leafColumns.map((column, col) => {
                  const kind = metaOf(column).filter ?? "text";
                  const value = (column.getFilterValue() as string | undefined) ?? "";
                  const filterLabel = `Filter ${nameOf(column)}`;
                  return (
                    <div
                      key={column.id}
                      role="gridcell"
                      aria-colindex={col + 1}
                      data-cell={`1:${col}`}
                      tabIndex={isTabStop(1, col) ? 0 : -1}
                      onFocus={(e) => e.target === e.currentTarget && setActiveCell({ row: 1, col })}
                      className={cx("flex flex-none items-center px-1.5 bg-[var(--rd-color-surface-subtle)]", cellFocus)}
                      style={{ width: column.getSize(), ...pinStyle(column, 3) }}
                    >
                      {kind === "select" ? (
                        <select
                          tabIndex={-1}
                          aria-label={filterLabel}
                          value={value}
                          onChange={(e) => column.setFilterValue(e.target.value || undefined)}
                          onFocus={() => setActiveCell({ row: 1, col })}
                          className={widgetInput}
                        >
                          <option value="">All</option>
                          {(selectOptions[column.id] ?? []).map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : kind === "set" ? (
                        <SetFilter
                          label={filterLabel}
                          options={selectOptions[column.id] ?? []}
                          value={Array.isArray(column.getFilterValue()) ? (column.getFilterValue() as string[]) : []}
                          onChange={(next) => column.setFilterValue(next)}
                        />
                      ) : kind === "text" ? (
                        <input
                          type="search"
                          tabIndex={-1}
                          aria-label={filterLabel}
                          placeholder="Filter"
                          value={value}
                          onChange={(e) => column.setFilterValue(e.target.value || undefined)}
                          onFocus={() => setActiveCell({ row: 1, col })}
                          className={widgetInput}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Body */}
          <div
            role="rowgroup"
            className="relative"
            style={{ width: totalWidth, minWidth: "100%", height: isEmpty ? rowHeight * 2 : bodyHeight }}
          >
            {isEmpty && (
              <div role="row" aria-rowindex={bodyStart + 1} className="flex">
                <div role="gridcell" aria-colspan={colCount} className="flex-1 px-3 py-6 text-center text-[var(--rd-color-text-muted)]">
                  {isLoading ? "Loading…" : emptyMessage}
                </div>
              </div>
            )}
            {rendered.map(({ index, top }) => {
              const item = items[index];
              const row = item.row;
              const gridRow = bodyStart + index;
              if (item.kind === "detail") {
                return (
                  <div
                    key={`${row.id}:detail`}
                    role="row"
                    aria-rowindex={rowOffset + index + bodyStart + 1}
                    aria-level={isHierarchical ? row.depth + 2 : undefined}
                    className="absolute left-0 flex border-b border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]"
                    style={{ ...rowStyle, height: detailHeight, top }}
                  >
                    <div
                      role="gridcell"
                      aria-colindex={1}
                      aria-colspan={colCount}
                      data-cell={`${gridRow}:0`}
                      tabIndex={isTabStop(gridRow, 0) ? 0 : -1}
                      onFocus={(e) => e.target === e.currentTarget && setActiveCell({ row: gridRow, col: activeCol })}
                      // Stays in view while the grid scrolls sideways.
                      className={cx("sticky left-0 overflow-auto p-3", cellFocus)}
                      style={{ width: viewWidth || "100%", height: detailHeight }}
                    >
                      {renderDetail!(row.original)}
                    </div>
                  </div>
                );
              }
              const isGroup = row.getIsGrouped();
              // A group row is selected when all its rows are.
              const selected = isGroup ? row.getIsAllSubRowsSelected() : row.getIsSelected();
              const canExpand = row.getCanExpand();
              return (
                <div
                  key={row.id}
                  role="row"
                  aria-rowindex={rowOffset + index + bodyStart + 1}
                  aria-selected={hasSelection ? selected : undefined}
                  aria-level={isHierarchical ? row.depth + 1 : undefined}
                  aria-expanded={canExpand ? row.getIsExpanded() : undefined}
                  data-selected={selected || undefined}
                  data-group={isGroup || undefined}
                  onDragOver={
                    dragId
                      ? (e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          const box = e.currentTarget.getBoundingClientRect();
                          const after = e.clientY > box.top + box.height / 2;
                          if (drop?.id !== row.id || drop.after !== after) setDrop({ id: row.id, after });
                        }
                      : undefined
                  }
                  onDrop={
                    dragId
                      ? (e) => {
                          e.preventDefault();
                          finishDrag();
                        }
                      : undefined
                  }
                  onDoubleClick={isGroup ? () => row.toggleExpanded() : onRowAction ? () => onRowAction(row.original) : undefined}
                  className={
                    "group absolute left-0 flex border-b border-[var(--rd-color-border-default)] " +
                    "hover:bg-[var(--rd-color-surface-subtle)] data-[selected]:bg-[var(--rd-color-surface-selected)] " +
                    "data-[group]:font-medium"
                  }
                  style={{ ...rowStyle, top }}
                >
                  {drop?.id === row.id && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 z-[4] h-0.5 bg-[var(--rd-color-action-primary)]"
                      style={drop.after ? { bottom: 0 } : { top: 0 }}
                    />
                  )}
                  {row.getVisibleCells().map((cell, col) => {
                    const column = cell.column;
                    const pinned = column.getIsPinned();
                    const editable = canEdit(column) && !isGroup;
                    const isEditing = edit?.row === gridRow && edit.col === col;
                    const toggle = isToggleCell(row, col);
                    const inFill =
                      !!fill &&
                      gridRow >= fill.target.r0 &&
                      gridRow <= fill.target.r1 &&
                      col >= fill.target.c0 &&
                      col <= fill.target.c1 &&
                      !(gridRow >= fill.source.r0 && gridRow <= fill.source.r1 && col >= fill.source.c0 && col <= fill.source.c1);
                    // The handle sits on the bottom-right cell of the selection (or the focused cell).
                    const showHandle =
                      canFill &&
                      gridFocused &&
                      !fill &&
                      !edit &&
                      !isGroup &&
                      !isSystemColumn(column.id) &&
                      gridRow === (rect ? rect.r1 : activeRow) &&
                      col === (rect ? rect.c1 : activeCol);
                    const inRange = !!rect && gridRow >= rect.r0 && gridRow <= rect.r1 && col >= rect.c0 && col <= rect.c1;
                    // Tree rows step in by depth; group rows and their rows line up by column.
                    const indent = isTree && col === expanderCol ? row.depth * 20 + (canExpand ? 0 : 24) : 0;
                    return (
                      <div
                        key={cell.id}
                        role="gridcell"
                        aria-colindex={col + 1}
                        aria-readonly={anyEditable && !editable && column.id !== SELECT_ID ? true : undefined}
                        aria-selected={inRange || undefined}
                        data-range={inRange || undefined}
                        data-fill={inFill || undefined}
                        data-cell={`${gridRow}:${col}`}
                        tabIndex={isTabStop(gridRow, col) ? 0 : -1}
                        onFocus={(e) => e.target === e.currentTarget && setActiveCell({ row: gridRow, col })}
                        onMouseDown={(e) => {
                          if (isEditing) return;
                          if (rangeSelection && e.button === 0 && !isSystemColumn(column.id)) {
                            if (e.shiftKey && activeRow >= bodyStart) {
                              e.preventDefault(); // no text selection while extending a block
                              setAnchor(anchor ? { row: anchorRow, col: anchorCol } : { row: activeRow, col: activeCol });
                              dragStart.current = null;
                            } else {
                              setAnchor(null);
                              dragStart.current = { row: gridRow, col };
                            }
                          }
                          setActiveCell({ row: gridRow, col });
                          focusPending.current = true;
                        }}
                        onMouseEnter={() => {
                          const start = dragStart.current;
                          if (!start || (start.row === gridRow && start.col === col)) return;
                          setAnchor(start);
                          setActiveCell({ row: gridRow, col });
                          focusPending.current = true;
                        }}
                        // Phones: there's no key to type on a cell and no on-screen
                        // keyboard until an input has focus. Like a spreadsheet, the
                        // first tap selects the cell and a second tap edits it.
                        onPointerDown={(e) => {
                          tappedActive.current = e.pointerType === "touch" && active.row === gridRow && active.col === col;
                        }}
                        onPointerUp={(e) => {
                          if (e.pointerType === "touch" && tappedActive.current && editable && !isEditing) startEdit(gridRow, col);
                          tappedActive.current = false;
                        }}
                        onDoubleClick={
                          editable
                            ? (e) => {
                                e.stopPropagation(); // edit instead of the row action
                                startEdit(gridRow, col);
                              }
                            : undefined
                        }
                        className={cx(
                          "flex flex-none items-center overflow-hidden",
                          isEditing ? "px-1" : "px-3",
                          editable && "cursor-text",
                          rangeSelection && !isEditing && "select-none",
                          inRange && "bg-[var(--rd-color-surface-selected)]",
                          inFill && "bg-[var(--rd-color-surface-selected)] shadow-[inset_0_0_0_1px_var(--rd-color-action-primary)]",
                          showHandle && "relative",
                          pinned &&
                            "bg-[var(--rd-color-surface-default)] group-hover:bg-[var(--rd-color-surface-subtle)] " +
                              "group-data-[selected]:bg-[var(--rd-color-surface-selected)]",
                          align(column),
                          cellFocus,
                        )}
                        style={{ width: column.getSize(), paddingInlineStart: indent ? 12 + indent : undefined, ...pinStyle(column) }}
                      >
                        {showHandle && (
                          <span
                            aria-hidden="true"
                            data-fill-handle=""
                            onMouseDown={(e) => {
                              if (e.button !== 0) return;
                              e.preventDefault(); // keep focus in the grid
                              e.stopPropagation(); // not the start of a range drag
                              const source = rect ?? { r0: activeRow, r1: activeRow, c0: activeCol, c1: activeCol };
                              setFill({ source, target: source });
                            }}
                            className={
                              "absolute bottom-0 end-0 z-[3] size-2.5 cursor-crosshair border border-[var(--rd-color-surface-default)] " +
                              "bg-[var(--rd-color-action-primary)]"
                            }
                          />
                        )}
                        {toggle && <ExpandToggle expanded={row.getIsExpanded()} onToggle={() => row.toggleExpanded()} />}
                        {column.id === REORDER_ID ? (
                          isGroup ? null : (
                            <RowHandle
                              name={rowName(row)}
                              canReorder={canReorder}
                              onDragStart={(e) => {
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", row.id);
                                const rowEl = (e.currentTarget as HTMLElement).closest('[role="row"]');
                                if (rowEl) e.dataTransfer.setDragImage(rowEl, 16, 16);
                                dragStart.current = null; // the browser drag ends without a mouseup
                                setDragId(row.id);
                              }}
                              onDragEnd={endDrag}
                            />
                          )
                        ) : column.id === SELECT_ID && isGroup ? (
                          <SelectBox
                            label="Select group"
                            checked={selected}
                            indeterminate={!selected && row.getIsSomeSelected()}
                            onToggle={() => row.toggleSelected(!selected)}
                          />
                        ) : cell.getIsGrouped() ? (
                          <span className="truncate">
                            {flexRender(column.columnDef.cell, cell.getContext())}{" "}
                            <span className="font-normal text-[var(--rd-color-text-muted)]">({numberFormat.format(row.getLeafRows().length)})</span>
                          </span>
                        ) : isGroup ? (
                          // Only columns with an aggregationFn show a total; others stay empty
                          // rather than showing the first row's value.
                          column.getAggregationFn() && !cell.getIsPlaceholder() ? (
                            <span className="truncate">{flexRender(column.columnDef.aggregatedCell ?? column.columnDef.cell, cell.getContext())}</span>
                          ) : null
                        ) : cell.getIsPlaceholder() ? null : isEditing ? (
                          <input
                            ref={(el) => {
                              if (el && document.activeElement !== el) {
                                el.focus();
                                el.setSelectionRange(el.value.length, el.value.length);
                              }
                            }}
                            aria-label={`Edit ${nameOf(column)}`}
                            aria-invalid={edit.invalid || undefined}
                            inputMode={metaOf(column).editor === "number" ? "decimal" : undefined}
                            value={edit.draft}
                            onChange={(e) => setEdit({ ...edit, draft: e.target.value, invalid: false })}
                            onBlur={() => {
                              if (!commitEdit(false)) cancelEdit(false); // clicking away never traps focus
                            }}
                            className={cx(
                              widgetInput,
                              metaOf(column).align === "end" && "text-end",
                              edit.invalid && "border-[var(--rd-color-feedback-danger)] focus:ring-[var(--rd-color-feedback-danger)]",
                            )}
                          />
                        ) : (
                          <span className="truncate">{flexRender(column.columnDef.cell, cell.getContext())}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {status}
      </div>

      {isPaged && (
        <div
          role="group"
          aria-label="Pagination"
          className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--rd-color-border-default)] px-3 py-2"
        >
          <p aria-live="polite" className="text-[var(--rd-color-text-muted)]">
            {total === 0
              ? "No rows"
              : `Rows ${numberFormat.format(rowOffset + 1)}–${numberFormat.format(Math.min(rowOffset + pageSize, total))} of ${numberFormat.format(total)}`}
          </p>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" aria-label="First page" isDisabled={pageIndex === 0} onPress={() => setPageIndex(0)}>
              «
            </Button>
            <Button size="sm" variant="ghost" aria-label="Previous page" isDisabled={pageIndex === 0} onPress={() => setPageIndex(pageIndex - 1)}>
              ‹
            </Button>
            <span className="px-2 tabular-nums text-[var(--rd-color-text-muted)]">
              Page {numberFormat.format(pageIndex + 1)} of {numberFormat.format(pageCount)}
            </span>
            <Button size="sm" variant="ghost" aria-label="Next page" isDisabled={pageIndex >= pageCount - 1} onPress={() => setPageIndex(pageIndex + 1)}>
              ›
            </Button>
            <Button size="sm" variant="ghost" aria-label="Last page" isDisabled={pageIndex >= pageCount - 1} onPress={() => setPageIndex(pageCount - 1)}>
              »
            </Button>
          </div>
        </div>
      )}

      {isLoading && !isEmpty && (
        <div
          role="status"
          className="absolute inset-0 flex items-center justify-center gap-2 bg-[var(--rd-color-surface-default)]/70 text-[var(--rd-color-text-muted)]"
        >
          <Spinner /> Loading…
        </div>
      )}
    </div>
  );
}
