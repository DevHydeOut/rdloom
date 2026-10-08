"use client";

import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { Button as AriaButton, Input, Label, SearchField } from "react-aria-components";
import { customerTableDefaults, type CustomerTableSpecProps } from "../generated/customer-table.types";
import { Alert } from "../alert/alert";
import { Avatar } from "../avatar/avatar";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import { Chart } from "../chart/chart";
import { EmptyState } from "../empty-state/empty-state";
import { Pagination } from "../pagination/pagination";
import { Select, SelectItem } from "../select/select";
import { Tooltip, TooltipTrigger } from "../tooltip/tooltip";
import { Skeleton } from "../skeleton/skeleton";
import { Stat } from "../stat/stat";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "../table/table";
import { cx } from "../utils/cx";
import { permissionFor } from "../utils/permissions";
import { CloseIcon, SearchIcon } from "../utils/icons";
import {
  applyQuery,
  customersToCsv,
  distinct,
  emptyQuery,
  formatDate,
  formatMoney,
  isFiltered,
  pageCountOf,
  summarize,
  type Customer,
  type CustomerInsights,
  type CustomerQuery,
  type CustomerSortColumn,
} from "./query";

export interface CustomerTableProps extends CustomerTableSpecProps {
  className?: string;
}

/** The parts of the block that take a class name of their own. */
export type CustomerTableSlot = "root" | "insights" | "stat" | "chart" | "toolbar" | "search" | "filters" | "export" | "table" | "cards" | "empty" | "error" | "footer" | "pagination";
export type CustomerTableClassNames = Partial<Record<CustomerTableSlot, string>>;

type Tone = "neutral" | "info" | "success" | "warning" | "danger";
const defaultTones: Record<string, Tone> = { active: "success", trial: "info", overdue: "warning", churned: "danger" };

const SORTS: Array<{ id: string; label: string; sort: CustomerQuery["sort"] }> = [
  { id: "default", label: "Default order", sort: null },
  { id: "joined-desc", label: "Newest first", sort: { column: "joinedAt", direction: "descending" } },
  { id: "joined-asc", label: "Oldest first", sort: { column: "joinedAt", direction: "ascending" } },
  { id: "mrr-desc", label: "Highest revenue", sort: { column: "mrr", direction: "descending" } },
  { id: "mrr-asc", label: "Lowest revenue", sort: { column: "mrr", direction: "ascending" } },
  { id: "name-asc", label: "Name, A to Z", sort: { column: "name", direction: "ascending" } },
  { id: "name-desc", label: "Name, Z to A", sort: { column: "name", direction: "descending" } },
];
const sortId = (sort: CustomerQuery["sort"]) => SORTS.find((s) => s.sort?.column === sort?.column && s.sort?.direction === sort?.direction)?.id ?? "default";

const control =
  "h-[var(--rd-size-control-md)] w-full rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] " +
  "ps-9 pe-9 text-sm text-[var(--rd-color-text-default)] [box-shadow:var(--rd-elevation-raised)] outline-none transition-colors " +
  "placeholder:text-[var(--rd-color-text-muted)] data-[hovered]:border-[var(--rd-color-border-strong)] " +
  "data-[focused]:border-[var(--rd-color-focus-ring)] data-[focused]:ring-2 data-[focused]:ring-[var(--rd-color-focus-ring)] [&::-webkit-search-cancel-button]:hidden";

/**
 * A ready-to-use customer list: search, filter by status and plan, sort, pages, CSV export,
 * loading rows, an empty state, an error with retry, and cards instead of a table on a phone.
 * Above it, a few totals and a chart that follow the filters. Give it the customers and it
 * works; for a large list from a server, set `serverSide` and answer `onQueryChange`.
 */
export const CustomerTable = forwardRef<HTMLElement, CustomerTableProps>(function CustomerTable(
  {
    customers,
    label = customerTableDefaults.label,
    pageSize = customerTableDefaults.pageSize,
    currency = customerTableDefaults.currency,
    locale,
    isLoading = customerTableDefaults.isLoading,
    error,
    onRetry,
    insights = "auto",
    serverSide = customerTableDefaults.serverSide,
    totalCount,
    onQueryChange,
    query: controlledQuery,
    defaultQuery,
    onExport,
    onOpenCustomer,
    onSelect,
    onSearch,
    onFilter,
    permissions,
    classNames,
    statusTones,
    density = customerTableDefaults.density,
    className,
  },
  ref,
) {
  const [ownQuery, setQuery] = useState<CustomerQuery>(() => ({ ...emptyQuery(pageSize), ...defaultQuery, pageSize }));
  // A query passed in (for example one read from the address) replaces the table's own.
  const query = controlledQuery ?? ownQuery;
  const [searchText, setSearchText] = useState(query.search);
  // Back and forward buttons change the query from outside: keep the search box in step.
  useEffect(() => setSearchText(query.search), [query.search]);
  const [notice, setNotice] = useState("");
  const exportReasonId = useId();
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(debounce.current), []);

  // A delayed search must change the query as it is then, not as it was when the key was pressed.
  const latest = useRef(query);
  latest.current = query;
  const update = (patch: Partial<CustomerQuery>) => {
    const before = latest.current;
    const next = { ...before, ...patch, page: patch.page ?? 1 };
    latest.current = next;
    setQuery(next);
    if (serverSide || controlledQuery) onQueryChange?.(next);
    if (next.search !== before.search) onSearch?.(next.search);
    if (next.status !== before.status || next.plan !== before.plan) onFilter?.({ status: next.status, plan: next.plan });
  };
  const changeSearch = (text: string) => {
    setSearchText(text);
    clearTimeout(debounce.current);
    // A server is asked once typing pauses; a list in memory is filtered at every key.
    if (serverSide) debounce.current = setTimeout(() => update({ search: text }), 250);
    else update({ search: text });
  };

  // --- The rows
  const client = useMemo(() => (serverSide ? null : applyQuery(customers, query)), [serverSide, customers, query]);
  const total = serverSide ? (totalCount ?? customers.length) : client!.total;
  const pageCount = pageCountOf(total, query.pageSize);
  const page = Math.min(query.page, pageCount);
  const rows = serverSide ? customers : client!.rows;
  const filtered = isFiltered(query);
  const options = useMemo(() => ({ status: distinct(customers, "status"), plan: distinct(customers, "plan") }), [customers]);
  const tones = { ...defaultTones, ...statusTones };
  const toneOf = (status: string): Tone => tones[status.toLowerCase()] ?? "neutral";

  // --- Totals and chart above the table: they follow the filters
  const shownInsights: CustomerInsights | null = useMemo(() => {
    if (insights === "none") return null;
    if (insights !== "auto") return insights;
    if (serverSide) return null; // a page of a server's list says nothing about the whole: pass `insights` yourself
    const s = summarize(client!.filtered);
    return {
      stats: [
        { label: "Customers", value: s.total },
        { label: "Active", value: s.active, description: s.total ? `${Math.round((s.active / s.total) * 100)}% of customers` : undefined },
        { label: "Monthly revenue", value: formatMoney(s.mrr, currency, locale) },
        { label: "Churned", value: s.churned },
      ],
      chart: s.byPlan.length
        ? {
            title: "Monthly revenue by plan",
            data: { labels: s.byPlan.map((p) => p.plan), series: [{ name: "Monthly revenue", values: s.byPlan.map((p) => p.mrr) }] },
            summary: `Monthly revenue split across ${s.byPlan.length} plan${s.byPlan.length === 1 ? "" : "s"}, ${formatMoney(s.mrr, currency, locale)} in all.`,
          }
        : undefined,
    };
  }, [insights, serverSide, client, currency, locale]);

  // --- Export
  const exportPermission = permissionFor(permissions, "export");
  const canExport = (!!onExport || !serverSide) && exportPermission.isVisible;
  const exportRows = () => {
    if (!exportPermission.isAllowed) return;
    const all = serverSide ? customers : client!.filtered;
    if (onExport) {
      onExport(all, query);
      return;
    }
    const url = URL.createObjectURL(new Blob(["﻿" + customersToCsv(all)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "customers.csv";
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${all.length} customer${all.length === 1 ? "" : "s"} to customers.csv`);
  };

  const clearFilters = () => {
    setSearchText("");
    clearTimeout(debounce.current);
    update({ search: "", status: [], plan: [] });
  };

  const first = total === 0 ? 0 : (page - 1) * query.pageSize + 1;
  const last = Math.min(page * query.pageSize, total);
  const money = (n: number) => formatMoney(n, currency, locale);

  const filterSelect = (name: "status" | "plan", all: string, values: string[]) => (
    <Select
      label={name === "status" ? "Status" : "Plan"}
      placeholder={all}
      size="md"
      className={cx("min-w-0 sm:w-40 [&>span:first-of-type]:sr-only", classNames?.filters)}
      selectedKey={query[name][0]?.toLowerCase() ?? "all"}
      onSelectionChange={(key) => update({ [name]: key === "all" || key === null ? [] : [values.find((v) => v.toLowerCase() === String(key)) ?? String(key)] })}
      isDisabled={isLoading}
    >
      <SelectItem id="all">{all}</SelectItem>
      {values.map((v) => (
        <SelectItem key={v} id={v.toLowerCase()} textValue={v}>
          {v}
        </SelectItem>
      ))}
    </Select>
  );

  const openPermission = permissionFor(permissions, "open");
  const openCustomer = (c: Customer) => {
    onOpenCustomer?.(c);
    onSelect?.(c);
  };
  const canOpen = (!!onOpenCustomer || !!onSelect) && openPermission.isAllowed;
  const openDisabled = (!!onOpenCustomer || !!onSelect) && openPermission.isDisabled;
  const openReasonId = useId();
  const customerCell = (c: Customer) => (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar name={c.name} src={c.avatarUrl} size="sm" decorative />
      <span className="flex min-w-0 flex-col">
        {canOpen ? (
          <AriaButton
            onPress={() => openCustomer(c)}
            className="w-fit max-w-full truncate rounded text-start font-medium text-[var(--rd-color-text-default)] underline-offset-2 outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)] data-[hovered]:underline"
          >
            {c.name}
          </AriaButton>
        ) : openDisabled ? (
          // Stays focusable, says why it does not work, and does nothing when pressed.
          <>
          <TooltipTrigger delay={300}>
            <AriaButton
              aria-disabled="true"
              aria-describedby={openPermission.reason ? `${openReasonId}-${c.id}` : undefined}
              onPress={() => {}}
              className="w-fit max-w-full cursor-not-allowed truncate rounded text-start font-medium text-[var(--rd-color-text-default)] opacity-70 outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
            >
              {c.name}
            </AriaButton>
            {openPermission.reason && <Tooltip>{openPermission.reason}</Tooltip>}
          </TooltipTrigger>
          {openPermission.reason && (
            <span id={`${openReasonId}-${c.id}`} className="sr-only">
              {openPermission.reason}
            </span>
          )}
          </>
        ) : (
          <span className="truncate font-medium text-[var(--rd-color-text-default)]">{c.name}</span>
        )}
        <span className="truncate text-xs text-[var(--rd-color-text-muted)]">{c.company ? `${c.email} · ${c.company}` : c.email}</span>
      </span>
    </span>
  );

  const showTable = !error && (isLoading || rows.length > 0);
  const empty = !error && !isLoading && rows.length === 0;

  return (
    <section ref={ref} aria-label={label} aria-busy={isLoading || undefined} className={cx("flex flex-col gap-6", className, classNames?.root)}>
      {shownInsights && (
        <div className={cx("flex min-w-0 flex-col gap-4", classNames?.insights)}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(10rem,100%),1fr))] gap-4">
            {shownInsights.stats.map((s) => (
              <Stat key={s.label} variant="card" label={s.label} value={s.value} trend={s.trend} data={s.data} description={s.description} summary={s.summary} isLoading={isLoading} className={classNames?.stat} />
            ))}
          </div>
          {shownInsights.chart && (
            <div className={cx("rounded-2xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-5 [box-shadow:var(--rd-elevation-raised)]", classNames?.chart)}>
              <Chart
                title={shownInsights.chart.title}
                summary={shownInsights.chart.summary}
                type={shownInsights.chart.type ?? "bar"}
                data={shownInsights.chart.data}
                valueFormat={(v) => formatMoney(v, currency, locale)}
                isLoading={isLoading}
                height={220}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Search, filters and export */}
        <div className={cx("flex flex-wrap items-center gap-2", classNames?.toolbar)}>
          <SearchField
            value={searchText}
            onChange={changeSearch}
            onClear={() => changeSearch("")}
            className={cx("group relative min-w-0 flex-1 basis-56", classNames?.search)}
            isDisabled={isLoading && customers.length === 0}
          >
            <Label className="sr-only">Search customers</Label>
            <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--rd-color-text-muted)]" />
            <Input placeholder="Search by name, email or company" className={control} />
            <AriaButton
              aria-label="Clear search"
              className="absolute end-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--rd-color-text-muted)] outline-none group-data-[empty]:hidden data-[hovered]:bg-[var(--rd-color-surface-subtle)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--rd-color-focus-ring)]"
            >
              <CloseIcon className="size-3" />
            </AriaButton>
          </SearchField>
          {filterSelect("status", "All statuses", options.status)}
          {filterSelect("plan", "All plans", options.plan)}
          <Select
            label="Sort by"
            size="md"
            className="min-w-0 basis-full sm:w-44 sm:basis-auto md:hidden [&>span:first-of-type]:sr-only"
            selectedKey={sortId(query.sort)}
            onSelectionChange={(key) => update({ sort: SORTS.find((s) => s.id === key)?.sort ?? null })}
          >
            {SORTS.map((s) => (
              <SelectItem key={s.id} id={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </Select>
          {filtered && (
            <Button variant="ghost" onPress={clearFilters}>
              Clear filters
            </Button>
          )}
          <div className="ms-auto flex items-center gap-3">
            <p role="status" className="text-sm whitespace-nowrap text-[var(--rd-color-text-muted)]">
              {isLoading ? "Loading customers" : `${total.toLocaleString(locale)} customer${total === 1 ? "" : "s"}`}
            </p>
            {canExport &&
              (exportPermission.isDisabled ? (
                <>
                  <TooltipTrigger delay={300}>
                    <Button variant="secondary" aria-disabled="true" aria-describedby={exportPermission.reason ? exportReasonId : undefined} onPress={() => {}} className={cx("cursor-not-allowed opacity-50", classNames?.export)}>
                      Export CSV
                    </Button>
                    {exportPermission.reason && <Tooltip>{exportPermission.reason}</Tooltip>}
                  </TooltipTrigger>
                  {exportPermission.reason && (
                    <span id={exportReasonId} className="sr-only">
                      {exportPermission.reason}
                    </span>
                  )}
                </>
              ) : (
                <Button variant="secondary" onPress={exportRows} isDisabled={isLoading || total === 0} className={classNames?.export}>
                  Export CSV
                </Button>
              ))}
          </div>
        </div>

        {error && (
          <Alert variant="danger" title="Couldn't load customers" className={classNames?.error}>
            <span className="flex flex-wrap items-center gap-3">
              {error}
              {onRetry && (
                <Button variant="secondary" size="sm" onPress={onRetry}>
                  Try again
                </Button>
              )}
            </span>
          </Alert>
        )}

        {showTable && (
          <>
            {/* A table where there is room for one */}
            <div className="hidden md:block">
              <Table
                label={label}
                density={density}
                className={classNames?.table}
                sortDescriptor={query.sort ?? undefined}
                onSortChange={(d) => update({ sort: { column: d.column as CustomerSortColumn, direction: d.direction } })}
              >
                <TableHeader>
                  <TableColumn id="name" isRowHeader allowsSorting>
                    Customer
                  </TableColumn>
                  <TableColumn id="plan" allowsSorting>
                    Plan
                  </TableColumn>
                  <TableColumn id="status" allowsSorting>
                    Status
                  </TableColumn>
                  <TableColumn id="mrr" allowsSorting className="!text-end">
                    Monthly revenue
                  </TableColumn>
                  <TableColumn id="joinedAt" allowsSorting>
                    Joined
                  </TableColumn>
                </TableHeader>
                <TableBody items={isLoading ? Array.from({ length: Math.min(query.pageSize, 5) }, (_, i) => ({ id: `loading-${i}` })) : rows}>
                  {(row: { id: string } | Customer) =>
                    "name" in row ? (
                      <TableRow id={row.id}>
                        <TableCell>{customerCell(row)}</TableCell>
                        <TableCell>{row.plan}</TableCell>
                        <TableCell>
                          <Badge variant={toneOf(row.status)} size="sm">
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="!text-end tabular-nums">{money(row.mrr)}</TableCell>
                        <TableCell className="whitespace-nowrap text-[var(--rd-color-text-muted)]">{formatDate(row.joinedAt, locale)}</TableCell>
                      </TableRow>
                    ) : (
                      <TableRow id={row.id}>
                        <TableCell>
                          {/* A row header with nothing in it would be an empty header for a screen reader. */}
                          <span className="sr-only">Loading customer</span>
                          <Skeleton variant="text" width="70%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="50%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="60%" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="40%" className="ms-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width="55%" />
                        </TableCell>
                      </TableRow>
                    )
                  }
                </TableBody>
              </Table>
            </div>

            {/* Cards where there is not */}
            <ul aria-label={`${label}, as a list`} className={cx("flex flex-col gap-3 md:hidden", classNames?.cards)}>
              {isLoading
                ? Array.from({ length: 3 }, (_, i) => (
                    <li key={i} className="rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] p-4">
                      <Skeleton variant="text" lines={3} />
                    </li>
                  ))
                : rows.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-col gap-3 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-4 [box-shadow:var(--rd-elevation-raised)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {customerCell(c)}
                        <Badge variant={toneOf(c.status)} size="sm">
                          {c.status}
                        </Badge>
                      </div>
                      <dl className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <dt className="text-xs text-[var(--rd-color-text-muted)]">Plan</dt>
                          <dd>{c.plan}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[var(--rd-color-text-muted)]">Revenue</dt>
                          <dd className="tabular-nums">{money(c.mrr)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[var(--rd-color-text-muted)]">Joined</dt>
                          <dd>{formatDate(c.joinedAt, locale)}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
            </ul>
          </>
        )}

        {empty && (
          <EmptyState
            size="md"
            className={classNames?.empty}
            title={filtered ? "No customers match" : "No customers yet"}
            description={filtered ? "Try a different search, or clear the filters to see everyone." : "People appear here once they sign up."}
          >
            {filtered && (
              <Button variant="secondary" onPress={clearFilters}>
                Clear filters
              </Button>
            )}
          </EmptyState>
        )}

        {/* Where you are, and the pages */}
        {!error && !isLoading && total > 0 && (
          <div className={cx("flex flex-wrap items-center justify-between gap-3", classNames?.footer)}>
            <p className="text-sm text-[var(--rd-color-text-muted)]">
              Showing {first.toLocaleString(locale)} to {last.toLocaleString(locale)} of {total.toLocaleString(locale)}
            </p>
            {pageCount > 1 && <Pagination pageCount={pageCount} page={page} onChange={(p) => update({ page: p })} size="sm" label={`${label} pages`} className={classNames?.pagination} />}
          </div>
        )}
      </div>

      <span role="status" className="sr-only">
        {notice}
      </span>
    </section>
  );
});
