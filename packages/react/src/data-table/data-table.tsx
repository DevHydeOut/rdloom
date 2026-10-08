"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button as AriaButton, Checkbox as AriaCheckbox, Input, Label, Link as AriaLink, SearchField, type Selection } from "react-aria-components";
import { dataTableDefaults, type DataTableSpecProps } from "../generated/data-table.types";
import { ActionButton } from "../action-button/action-button";
import { AlertDialog } from "../alert-dialog/alert-dialog";
import { Button } from "../button/button";
import { EmptyState } from "../empty-state/empty-state";
import { ErrorState } from "../error-state/error-state";
import { Menu, MenuItem, MenuTrigger } from "../menu/menu";
import { Pagination } from "../pagination/pagination";
import { Select, SelectItem } from "../select/select";
import { Sheet } from "../sheet/sheet";
import { Skeleton } from "../skeleton/skeleton";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "../table/table";
import { cx } from "../utils/cx";
import { CheckIcon, CloseIcon, DotsIcon, MinusIcon, SearchIcon } from "../utils/icons";
import { permissionFor, resolvePermission, type PermissionValue } from "../utils/permissions";
import { toDataState } from "../utils/state";
import {
  applyDataTableQuery,
  cellValue,
  completeQuery,
  filterCount,
  isFiltered,
  normalizeOptions,
  pageCountOf,
  rowsToCsv,
  valueText,
  type DataTableBulkAction,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableQuery,
  type DataTableRowAction,
} from "./query";

type Generic = "rows" | "columns" | "getRowId" | "filters" | "bulkActions" | "rowActions" | "onRowOpen" | "onSelect" | "rowHref" | "onExport";

export interface DataTableProps<Row> extends Omit<DataTableSpecProps, Generic> {
  rows: readonly Row[];
  columns: DataTableColumn<Row>[];
  getRowId: (row: Row) => string;
  filters?: DataTableFilter<Row>[];
  bulkActions?: DataTableBulkAction<Row>[];
  rowActions?: (row: Row) => DataTableRowAction<Row>[];
  onRowOpen?: (row: Row) => void;
  onSelect?: (row: Row) => void;
  rowHref?: (row: Row) => string;
  onExport?: (rows: Row[], query: DataTableQuery) => void;
  className?: string;
}

/** The parts of the block that take a class name of their own. */
export type DataTableSlot = "root" | "toolbar" | "search" | "filters" | "count" | "export" | "bulk-bar" | "table" | "header" | "row" | "cell" | "cards" | "card" | "empty" | "error" | "footer" | "pagination";
export type DataTableClassNames = Partial<Record<DataTableSlot, string>>;

const NARROW = 640;
const ALL = "__all";

const control =
  "h-[var(--rd-size-control-md)] w-full rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] " +
  "ps-9 pe-9 text-sm text-[var(--rd-color-text-default)] [box-shadow:var(--rd-elevation-raised)] outline-none transition-colors " +
  "placeholder:text-[var(--rd-color-text-muted)] data-[hovered]:border-[var(--rd-color-border-strong)] " +
  "data-[focused]:border-[var(--rd-color-focus-ring)] data-[focused]:ring-2 data-[focused]:ring-[var(--rd-color-focus-ring)] [&::-webkit-search-cancel-button]:hidden";

const checkbox =
  "relative flex size-4 shrink-0 items-center before:absolute before:-inset-3 before:content-['']  justify-center rounded-[var(--rd-radius-sm,4px)] border border-[var(--rd-color-border-strong)] outline-none " +
  "data-[selected]:border-transparent data-[selected]:bg-[var(--rd-color-action-primary)] data-[indeterminate]:border-transparent data-[indeterminate]:bg-[var(--rd-color-action-primary)] " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]";

const open =
  "w-fit max-w-full rounded text-start font-medium text-[var(--rd-color-text-default)] underline-offset-2 outline-none " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[hovered]:underline";

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "table";
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const alignClass = { start: "", center: "!text-center", end: "!text-end tabular-nums" } as const;

type FocusRequest = { kind: "row"; id: string; index: number } | { kind: "first" };

/**
 * The list screen of an admin, ERP or SaaS app: search, filters, sorting, pages, selection with bulk
 * actions, a More menu per row, CSV export, loading, empty and error states, and cards on a narrow
 * space. It never fetches: pass the rows (or one page with `serverSide`) and handle the actions.
 */
export function DataTable<Row>({
  rows,
  columns,
  getRowId,
  label = dataTableDefaults.label,
  state,
  isLoading = dataTableDefaults.isLoading,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  searchable,
  searchPlaceholder = dataTableDefaults.searchPlaceholder,
  filters = [],
  pageSize = dataTableDefaults.pageSize,
  query: controlledQuery,
  defaultQuery,
  onQueryChange,
  onSearch,
  onFilter,
  serverSide = dataTableDefaults.serverSide,
  totalCount,
  selectionMode = dataTableDefaults.selectionMode,
  selectedKeys: controlledSelection,
  defaultSelectedKeys,
  onSelectionChange,
  bulkActions = [],
  rowActions,
  onRowOpen,
  onSelect,
  rowHref,
  onExport,
  permissions,
  classNames,
  density = dataTableDefaults.density,
  layout = dataTableDefaults.layout,
  className,
}: DataTableProps<Row>) {
  const all = rows as Row[];
  const root = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [confirming, setConfirming] = useState<{ row: Row; action: DataTableRowAction<Row> } | null>(null);

  // The block's own width decides between table and cards, not the screen's.
  useEffect(() => {
    const el = root.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < NARROW));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const compact = layout === "cards" || (layout === "auto" && narrow);

  // --- The query: kept here, or by the app
  const [inner, setInner] = useState<DataTableQuery>(() => completeQuery(defaultQuery));
  const query = useMemo(() => (controlledQuery ? completeQuery(controlledQuery) : inner), [controlledQuery, inner]);
  const [searchText, setSearchText] = useState(query.search);
  const latest = useRef(query);
  latest.current = query;
  const lastSearch = useRef(query.search);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(debounce.current), []);
  // A search changed from outside (the back button, a shared link) shows in the box.
  useEffect(() => {
    if (query.search !== lastSearch.current) {
      lastSearch.current = query.search;
      setSearchText(query.search);
    }
  }, [query.search]);

  const update = (patch: Partial<DataTableQuery>) => {
    const before = latest.current;
    const next: DataTableQuery = { ...before, ...patch, page: patch.page ?? 1 };
    latest.current = next;
    if (!controlledQuery) setInner(next);
    onQueryChange?.(next);
    if (next.search !== before.search) {
      lastSearch.current = next.search;
      onSearch?.(next.search);
    }
    if (JSON.stringify(next.filters) !== JSON.stringify(before.filters)) onFilter?.(next.filters);
  };
  const changeSearch = (text: string) => {
    setSearchText(text);
    clearTimeout(debounce.current);
    // A server is asked once typing pauses; a list in memory is filtered at every key.
    if (serverSide) debounce.current = setTimeout(() => update({ search: text }), 250);
    else update({ search: text });
  };
  const setFilter = (id: string, values: string[]) => {
    const next = { ...latest.current.filters };
    if (values.length) next[id] = values;
    else delete next[id];
    update({ filters: next });
  };
  const clearFilters = () => {
    clearTimeout(debounce.current);
    setSearchText("");
    update({ search: "", filters: {} });
  };

  // --- The rows
  const searchColumns = Array.isArray(searchable) ? searchable : undefined;
  const client = useMemo(() => (serverSide ? null : applyDataTableQuery(all, columns, query, { pageSize, searchColumns, filters })), [serverSide, all, columns, query, pageSize, searchColumns?.join(","), filters]);
  const total = serverSide ? (totalCount ?? all.length) : client!.total;
  const pageCount = pageCountOf(total, pageSize);
  const page = Math.min(query.page, pageCount);
  const shown = serverSide ? all : client!.rows;
  const shownIds = shown.map(getRowId);
  const filtered = isFiltered(query);

  const dataState = state ?? toDataState({ isLoading, error });
  const loading = dataState === "loading";
  const failed = dataState === "error";
  const errorText = typeof error === "string" ? error : "Something went wrong. Try again in a moment.";
  const empty = !loading && !failed && (dataState === "empty" || shown.length === 0);
  const showRows = !failed && !empty && (loading || shown.length > 0);

  const lowerLabel = label.toLowerCase();
  const first = columns[0];
  const nameOf = (row: Row) => (first ? valueText(cellValue(row, first)) : "") || getRowId(row);
  const plain = (row: Row, column: DataTableColumn<Row>) => {
    const value = cellValue(row, column);
    return value instanceof Date ? value.toLocaleDateString() : valueText(value);
  };
  const cellOf = (row: Row, column: DataTableColumn<Row>): ReactNode => (column.cell ? column.cell(row) : plain(row, column));

  // --- Opening a row
  const canOpen = !!onRowOpen || !!onSelect || !!rowHref;
  const openRow = (row: Row) => {
    onRowOpen?.(row);
    onSelect?.(row);
  };
  const primary = (row: Row) => {
    const content = cellOf(row, first);
    if (rowHref) {
      return (
        <AriaLink href={rowHref(row)} onPress={() => openRow(row)} className={open}>
          {content}
        </AriaLink>
      );
    }
    if (canOpen) {
      return (
        <AriaButton onPress={() => openRow(row)} className={open}>
          {content}
        </AriaButton>
      );
    }
    return <span className="font-medium text-[var(--rd-color-text-default)]">{content}</span>;
  };

  // --- Selection (by row id, kept across pages; the header box selects the page)
  const selectPermission = permissionFor(permissions, "select");
  const selectable = selectionMode === "multiple" && selectPermission.isAllowed && !loading;
  const [innerSelection, setInnerSelection] = useState<Set<string>>(() => new Set(defaultSelectedKeys));
  const selected = controlledSelection ?? innerSelection;
  const changeSelection = (next: Set<string>) => {
    if (!controlledSelection) setInnerSelection(next);
    onSelectionChange?.(next);
  };
  const racSelection = (keys: Selection) => {
    const visible = new Set(shownIds);
    const off = [...selected].filter((k) => !visible.has(k));
    const picked = keys === "all" ? shownIds : [...keys].map(String).filter((k) => visible.has(k));
    changeSelection(new Set([...off, ...picked]));
  };
  // Rows that no longer exist (deleted, filtered out of the data) leave the selection.
  useEffect(() => {
    if (serverSide || loading || selected.size === 0) return;
    const known = new Set(all.map(getRowId));
    const kept = [...selected].filter((k) => known.has(k));
    if (kept.length !== selected.size) changeSelection(new Set(kept));
  });
  const selectedRows = all.filter((row) => selected.has(getRowId(row)));
  const pageSelected = shownIds.filter((id) => selected.has(id)).length;

  // --- Focus after something is removed or a bulk action ends: the next row, else the table, else the block
  useEffect(() => {
    if (!focusRequest) return;
    if (focusRequest.kind === "row" && shownIds.includes(focusRequest.id)) {
      // The row is still there: the app has not removed it (yet). Give up after a while.
      const t = setTimeout(() => setFocusRequest(null), 4000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      const items = body.current?.querySelectorAll<HTMLElement>(compact ? "[data-card]" : "tbody tr");
      const index = focusRequest.kind === "row" ? Math.min(focusRequest.index, (items?.length ?? 1) - 1) : 0;
      (items && items.length > 0 ? items[Math.max(0, index)] : root.current)?.focus();
      setFocusRequest(null);
    }, 50);
    return () => clearTimeout(t);
  }, [focusRequest, shownIds.join("\u0000"), compact]);

  // --- Row actions
  const rowActionsPermission = permissionFor(permissions, "rowActions");
  const hasRowActions = !!rowActions && rowActionsPermission.isVisible;
  const performRowAction = async (row: Row, action: DataTableRowAction<Row>) => {
    const index = shownIds.indexOf(getRowId(row));
    try {
      await action.onAction(row);
    } catch (e) {
      setNotice(`${action.label} failed for ${nameOf(row)}`);
      throw e;
    }
    setNotice(`${action.label} done for ${nameOf(row)}`);
    setFocusRequest({ kind: "row", id: getRowId(row), index: Math.max(0, index) });
  };
  const rowMenu = (row: Row): ReactNode => {
    const name = nameOf(row);
    const actions = (rowActions?.(row) ?? []).map((action) => ({ action, access: resolvePermission(action.permission) })).filter((x) => x.access.isVisible);
    if (!hasRowActions || actions.length === 0) return null;
    if (rowActionsPermission.isDisabled) {
      return (
        <Button variant="ghost" size="sm" aria-disabled="true" aria-label={`More actions for ${name}${rowActionsPermission.reason ? `, unavailable: ${rowActionsPermission.reason}` : ""}`} onPress={() => {}} className="cursor-not-allowed opacity-50">
          <DotsIcon />
        </Button>
      );
    }
    return (
      <MenuTrigger>
        <Button variant="ghost" size="sm" aria-label={`More actions for ${name}`}>
          <DotsIcon />
        </Button>
        <Menu
          placement="bottom end"
          onAction={(key) => {
            const found = actions.find((x) => x.action.id === key);
            if (!found || !found.access.isAllowed) return;
            if (found.action.confirm) setConfirming({ row, action: found.action });
            else void performRowAction(row, found.action).catch(() => {});
          }}
        >
          {actions.map(({ action, access }) => (
            <MenuItem key={action.id} id={action.id} variant={action.variant} isDisabled={!access.isAllowed} textValue={access.reason ? `${action.label}, ${access.reason}` : action.label}>
              {access.reason && !access.isAllowed ? (
                <span className="flex flex-col">
                  {action.label}
                  <span className="text-xs font-normal text-[var(--rd-color-text-muted)]">{access.reason}</span>
                </span>
              ) : (
                action.label
              )}
            </MenuItem>
          ))}
        </Menu>
      </MenuTrigger>
    );
  };

  // --- Bulk actions
  const bulkPermission = permissionFor(permissions, "bulk");
  const showBulk = selectable && selected.size > 0 && bulkActions.length > 0 && bulkPermission.isVisible;
  const bulkAccess = (action: DataTableBulkAction<Row>): PermissionValue | undefined => (bulkPermission.isDisabled ? { state: "disabled", reason: bulkPermission.reason } : action.permission);
  const count = selected.size;
  const rowWord = (n: number) => plural(n, "row", "rows");

  // --- Export
  const exportPermission = permissionFor(permissions, "export");
  const canExport = (!!onExport || !serverSide) && exportPermission.isVisible;
  const exportAccess: PermissionValue | undefined = exportPermission.isAllowed && (loading || failed || total === 0) ? "disabled" : permissions?.export;
  const exportRows = () => {
    const out = serverSide ? all : client!.filtered;
    if (onExport) {
      onExport(out, latest.current);
      return;
    }
    const url = URL.createObjectURL(new Blob(["﻿" + rowsToCsv(out, columns)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug(label)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${out.length} ${rowWord(out.length)} to ${slug(label)}.csv`);
  };

  // --- Filters and sort controls
  const filterSelect = (f: DataTableFilter<Row>, inSheet: boolean) => (
    <Select
      key={f.id}
      label={f.label}
      placeholder={`${f.label}: all`}
      size="md"
      className={cx(inSheet ? "w-full" : "min-w-0 sm:w-44 [&>span:first-of-type]:sr-only", classNames?.filters)}
      selectedKey={query.filters[f.id]?.[0] ?? ALL}
      onSelectionChange={(key) => setFilter(f.id, key === ALL || key === null ? [] : [String(key)])}
      isDisabled={loading}
    >
      <SelectItem id={ALL} textValue={`${f.label}: all`}>{`${f.label}: all`}</SelectItem>
      {normalizeOptions(f.options).map((o) => (
        <SelectItem key={o.value} id={o.value} textValue={o.label}>
          {o.label}
        </SelectItem>
      ))}
    </Select>
  );
  const sortChoices = columns.filter((c) => c.sortable).flatMap((c) => [`${c.id}:ascending`, `${c.id}:descending`]);
  const sortLabel = (choice: string) => {
    const [id, direction] = choice.split(":");
    return `${columns.find((c) => c.id === id)?.header ?? id}, ${direction}`;
  };
  const appliedFilters = filterCount(query.filters);

  // --- Pieces
  const cardCheckbox = (id: string, name: string) => (
    <AriaCheckbox
      aria-label={`Select ${name}`}
      isSelected={selected.has(id)}
      onChange={(on) => {
        const next = new Set(selected);
        if (on) next.add(id);
        else next.delete(id);
        changeSelection(next);
      }}
      className={checkbox}
    >
      {({ isSelected }) => (isSelected ? <CheckIcon className="size-3.5 text-[var(--rd-color-action-on-primary)]" /> : null)}
    </AriaCheckbox>
  );
  const skeletonCount = Math.min(Math.max(1, pageSize), 5);
  const skeletonWidths = ["70%", "50%", "60%", "40%", "55%"];

  const countText = loading ? `Loading ${lowerLabel}` : failed ? `Could not load ${lowerLabel}` : `${total.toLocaleString()} ${plural(total, "result", "results")}`;
  const firstShown = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastShown = Math.min(page * pageSize, total);

  return (
    <section ref={root} tabIndex={-1} aria-label={label} aria-busy={loading || undefined} className={cx("flex flex-col gap-3 outline-none", className, classNames?.root)}>
      {/* Search, filters and export */}
      <div className={cx("flex flex-wrap items-center gap-2", classNames?.toolbar)}>
        {searchable && (
          <SearchField value={searchText} onChange={changeSearch} onClear={() => changeSearch("")} isDisabled={loading && all.length === 0} className={cx("group relative min-w-0 flex-1 basis-56", classNames?.search)}>
            <Label className="sr-only">{`Search ${lowerLabel}`}</Label>
            <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--rd-color-text-muted)]" />
            <Input placeholder={searchPlaceholder} className={control} />
            <AriaButton
              aria-label="Clear search"
              className="absolute end-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--rd-color-text-muted)] outline-none group-data-[empty]:hidden data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
            >
              <CloseIcon className="size-3" />
            </AriaButton>
          </SearchField>
        )}
        {!compact && filters.map((f) => filterSelect(f, false))}
        {compact && (filters.length > 0 || sortChoices.length > 0) && (
          <Button variant="secondary" onPress={() => setFiltersOpen(true)} className={classNames?.filters}>
            {appliedFilters > 0 ? `Filters (${appliedFilters})` : "Filters"}
          </Button>
        )}
        {filtered && (
          <Button variant="ghost" onPress={clearFilters}>
            Clear filters
          </Button>
        )}
        <div className="ms-auto flex items-center gap-3">
          <p role="status" className={cx("text-sm whitespace-nowrap text-[var(--rd-color-text-muted)]", classNames?.count)}>
            {countText}
          </p>
          {canExport && (
            <ActionButton variant="secondary" permission={exportAccess} onAction={exportRows} className={classNames?.export}>
              Export CSV
            </ActionButton>
          )}
        </div>
      </div>

      {/* What to do with the selected rows. It does not take focus. */}
      {showBulk && (
        <div role="group" aria-label="Bulk actions" className={cx("flex flex-wrap items-center gap-2 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-selected)] px-3 py-2", classNames?.["bulk-bar"])}>
          <span aria-hidden="true" className="me-1 text-sm font-medium text-[var(--rd-color-text-default)]">
            {count} selected
          </span>
          {bulkActions.map((action) => (
            <ActionButton
              key={action.id}
              size="sm"
              variant={action.variant === "danger" ? "danger" : "secondary"}
              icon={action.icon}
              permission={bulkAccess(action)}
              confirm={
                action.confirm && {
                  title: action.confirm.title,
                  description: `${action.confirm.description ? `${action.confirm.description} ` : ""}This affects ${count} selected ${rowWord(count)}.`,
                  confirmLabel: action.confirm.confirmLabel,
                }
              }
              onAction={() => action.onAction(selectedRows)}
              onSuccess={() => {
                setNotice(`${action.label} done for ${count} ${rowWord(count)}`);
                changeSelection(new Set());
                setFocusRequest({ kind: "first" });
              }}
              onError={() => setNotice(`${action.label} failed`)}
            >
              {action.label}
            </ActionButton>
          ))}
          <Button variant="ghost" size="sm" onPress={() => changeSelection(new Set())}>
            Clear selection
          </Button>
        </div>
      )}

      <div ref={body} className="flex flex-col gap-3 outline-none">
        {failed && (
          <ErrorState
            variant="inline"
            title={`Couldn't load ${lowerLabel}`}
            description={errorText}
            className={classNames?.error}
            actions={
              onRetry && (
                <Button variant="secondary" onPress={onRetry}>
                  Try again
                </Button>
              )
            }
          />
        )}

        {empty && (
          <EmptyState
            size="md"
            className={classNames?.empty}
            title={filtered ? "No results" : (emptyTitle ?? "Nothing here yet")}
            description={filtered ? "Try a different search, or clear the filters to see everything." : emptyDescription}
          >
            {filtered ? (
              <Button variant="secondary" onPress={clearFilters}>
                Clear filters
              </Button>
            ) : (
              emptyAction
            )}
          </EmptyState>
        )}

        {showRows && !compact && (
          <Table
            label={label}
            density={density}
            className={classNames?.table}
            selectionMode={selectable ? "multiple" : "none"}
            selectedKeys={selected}
            onSelectionChange={racSelection}
            sortDescriptor={query.sort ? { column: query.sort.column, direction: query.sort.direction } : null}
            onSortChange={(d) => update({ sort: d ? { column: String(d.column), direction: d.direction } : null })}
          >
            <TableHeader className={classNames?.header}>
              {columns.map((c, i) => (
                <TableColumn key={c.id} id={c.id} isRowHeader={i === 0} allowsSorting={!!c.sortable} className={cx(c.align === "end" && "!text-end", c.align === "center" && "!text-center")} style={c.width ? { width: c.width } : undefined}>
                  {c.header}
                </TableColumn>
              ))}
              {hasRowActions && (
                <TableColumn id="__actions" className="w-12">
                  <span className="sr-only">Actions</span>
                </TableColumn>
              )}
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: skeletonCount }, (_, r) => (
                    <TableRow key={`loading-${r}`} id={`loading-${r}`} textValue="Loading" className={classNames?.row}>
                      {columns.map((c, i) => (
                        <TableCell key={c.id} className={classNames?.cell}>
                          {/* A row header with nothing in it would be an empty header for a screen reader. */}
                          {i === 0 && <span className="sr-only">Loading row</span>}
                          <Skeleton variant="text" width={skeletonWidths[(i + r) % skeletonWidths.length]} className={c.align === "end" ? "ms-auto" : undefined} />
                        </TableCell>
                      ))}
                      {hasRowActions && <TableCell className={classNames?.cell}>{null}</TableCell>}
                    </TableRow>
                  ))
                : shown.map((row) => (
                    <TableRow key={getRowId(row)} id={getRowId(row)} textValue={nameOf(row)} className={classNames?.row}>
                      {columns.map((c, i) => (
                        <TableCell key={c.id} className={cx(alignClass[c.align ?? "start"], classNames?.cell)}>
                          {i === 0 ? primary(row) : cellOf(row, c)}
                        </TableCell>
                      ))}
                      {hasRowActions && <TableCell className={cx("!text-end", classNames?.cell)}>{rowMenu(row)}</TableCell>}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}

        {showRows && compact && (
          <>
            {selectable && (
              <AriaCheckbox
                aria-label="Select all on this page"
                isSelected={pageSelected > 0 && pageSelected === shownIds.length}
                isIndeterminate={pageSelected > 0 && pageSelected < shownIds.length}
                onChange={(on) => racSelection(on ? "all" : new Set())}
                className="group/all flex items-center gap-2 text-sm text-[var(--rd-color-text-muted)] outline-none"
              >
                {({ isSelected, isIndeterminate }) => (
                  <>
                    <span className={checkbox} data-selected={isSelected || undefined} data-indeterminate={isIndeterminate || undefined}>
                      {isIndeterminate ? <MinusIcon className="size-3.5 text-[var(--rd-color-action-on-primary)]" /> : isSelected ? <CheckIcon className="size-3.5 text-[var(--rd-color-action-on-primary)]" /> : null}
                    </span>
                    Select all on this page
                  </>
                )}
              </AriaCheckbox>
            )}
            <ul aria-label={`${label}, as a list`} className={cx("flex flex-col gap-3", classNames?.cards)}>
              {loading
                ? Array.from({ length: 3 }, (_, i) => (
                    <li key={i} className={cx("rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] p-4", classNames?.card)}>
                      <Skeleton variant="text" lines={3} />
                    </li>
                  ))
                : shown.map((row) => {
                    const id = getRowId(row);
                    return (
                      <li
                        key={id}
                        data-card=""
                        tabIndex={-1}
                        className={cx(
                          "flex flex-col gap-3 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-4 outline-none [box-shadow:var(--rd-elevation-raised)]",
                          selected.has(id) && "bg-[var(--rd-color-surface-selected)]",
                          classNames?.card,
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {selectable && <span className="pt-0.5">{cardCheckbox(id, nameOf(row))}</span>}
                          <div className="min-w-0 flex-1">{primary(row)}</div>
                          {rowMenu(row)}
                        </div>
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                          {columns.slice(1).filter((c) => !c.hideOnMobile).map((c) => (
                            <div key={c.id} className="min-w-0">
                              <dt className="text-xs text-[var(--rd-color-text-muted)]">{c.header}</dt>
                              <dd className="break-words">{cellOf(row, c)}</dd>
                            </div>
                          ))}
                        </dl>
                      </li>
                    );
                  })}
            </ul>
          </>
        )}
      </div>

      {/* Where you are, and the pages */}
      {showRows && !loading && total > 0 && (
        <div className={cx("flex flex-wrap items-center justify-between gap-3", classNames?.footer)}>
          <p className="text-sm text-[var(--rd-color-text-muted)]">
            Showing {firstShown.toLocaleString()} to {lastShown.toLocaleString()} of {total.toLocaleString()}
          </p>
          {pageCount > 1 && <Pagination pageCount={pageCount} page={page} onChange={(p) => update({ page: p })} size="sm" label={`${label} pages`} className={classNames?.pagination} />}
        </div>
      )}

      {/* On a narrow space the filters and the sort live in a sheet */}
      {compact && (
        <Sheet title="Filters" side="bottom" size="md" isOpen={filtersOpen} onOpenChange={setFiltersOpen}>
          <div className="flex flex-col gap-4">
            {filters.map((f) => filterSelect(f, true))}
            {sortChoices.length > 0 && (
              <Select
                label="Sort by"
                size="md"
                className="w-full"
                selectedKey={query.sort ? `${query.sort.column}:${query.sort.direction}` : ALL}
                onSelectionChange={(key) => {
                  if (key === ALL || key === null) update({ sort: null });
                  else {
                    const [column, direction] = String(key).split(":");
                    update({ sort: { column, direction: direction === "descending" ? "descending" : "ascending" } });
                  }
                }}
              >
                <SelectItem id={ALL}>Default order</SelectItem>
                {sortChoices.map((choice) => (
                  <SelectItem key={choice} id={choice} textValue={sortLabel(choice)}>
                    {sortLabel(choice)}
                  </SelectItem>
                ))}
              </Select>
            )}
            <div className="flex justify-end gap-2">
              {filtered && (
                <Button variant="ghost" onPress={clearFilters}>
                  Clear filters
                </Button>
              )}
              <Button onPress={() => setFiltersOpen(false)}>Show {total.toLocaleString()} {plural(total, "result", "results")}</Button>
            </div>
          </div>
        </Sheet>
      )}

      {confirming && (
        <AlertDialog
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setConfirming(null);
          }}
          tone={confirming.action.variant === "danger" ? "danger" : "default"}
          title={confirming.action.confirm!.title}
          description={confirming.action.confirm!.description ?? `This applies to ${nameOf(confirming.row)}.`}
          confirmLabel={confirming.action.confirm!.confirmLabel}
          onConfirm={() => performRowAction(confirming.row, confirming.action)}
        />
      )}

      {/* Announcements: how many are selected, and what an action did */}
      <span role="status" className="sr-only">
        {showBulk || (selectable && count > 0) ? `${count} selected` : ""}
      </span>
      <span role="status" className="sr-only">
        {notice}
      </span>
    </section>
  );
}
