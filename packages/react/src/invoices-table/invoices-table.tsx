"use client";

import { forwardRef, useMemo, useState } from "react";
import { invoicesTableDefaults, type InvoicesTableSpecProps } from "../generated/invoices-table.types";
import { Badge } from "../badge/badge";
import { DataTable, type DataTableClassNames } from "../data-table/data-table";
import type { DataTableBulkAction, DataTableColumn, DataTableFilter, DataTableRowAction } from "../data-table/query";
import { Stat } from "../stat/stat";
import { cx } from "../utils/cx";
import { useDefaultLocale } from "../utils/use-default-locale";
import { permissionFor } from "../utils/permissions";
import {
  daysOverdue,
  effectiveStatus,
  formatDay,
  formatMoney,
  invoiceStatusLabels,
  invoiceStatuses,
  isUnpaid,
  isVoidable,
  summarize,
  todayIso,
  type Invoice,
  type InvoiceStatus,
} from "./query";

export interface InvoicesTableProps extends InvoicesTableSpecProps {
  className?: string;
}

/** The parts of the block that take a class name of their own. */
export type InvoicesTableSlot = "summary" | "stat" | keyof DataTableClassNames;
export type InvoicesTableClassNames = Partial<Record<InvoicesTableSlot, string>>;

type Tone = "neutral" | "info" | "success" | "warning" | "danger";
const defaultTones: Record<InvoiceStatus, Tone> = { draft: "neutral", open: "info", overdue: "warning", paid: "success", void: "neutral" };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The invoice list of a billing page: number, customer, dates, amount and a status in words, with
 * overdue worked out from the due date, totals above, and the invoice actions (download, remind,
 * record payment, void) behind permissions and confirmations. It is a DataTable underneath, so search,
 * filters, sorting, pages, selection, CSV, states, cards on a phone and server-side data all work as
 * they do there. It never fetches, sends or charges: you pass the invoices and do the actions.
 */
export const InvoicesTable = forwardRef<HTMLDivElement, InvoicesTableProps>(function InvoicesTable(
  {
    invoices,
    label = invoicesTableDefaults.label,
    currency = invoicesTableDefaults.currency,
    locale: localeProp,
    asOf,
    summary = invoicesTableDefaults.summary,
    pageSize = invoicesTableDefaults.pageSize,
    selectionMode,
    serverSide = invoicesTableDefaults.serverSide,
    emptyTitle = "No invoices yet",
    emptyDescription = "Invoices show up here once they are sent.",
    onOpenInvoice,
    onDownload,
    onSendReminder,
    onMarkPaid,
    onVoid,
    permissions,
    statusTones,
    classNames,
    className,
    isLoading = invoicesTableDefaults.isLoading,
    ...rest
  },
  ref,
) {
  const locale = useDefaultLocale(localeProp);
  // The day is read once, so a page left open past midnight does not change under the reader.
  const [today] = useState(todayIso);
  const day = asOf ?? today;
  const tones = { ...defaultTones, ...statusTones };

  const statusOf = (invoice: Invoice) => effectiveStatus(invoice, day);
  const money = (invoice: Invoice) => formatMoney(invoice.amount, invoice.currency ?? currency, locale);

  const columns = useMemo<DataTableColumn<Invoice>[]>(
    () => [
      { id: "number", header: "Invoice", sortable: true, cell: (invoice) => <span className="font-medium">{invoice.number}</span>, value: (invoice) => invoice.number },
      {
        id: "customer",
        header: "Customer",
        sortable: true,
        value: (invoice) => invoice.customer,
        cell: (invoice) => (
          <span className="flex flex-col">
            <span>{invoice.customer}</span>
            {invoice.customerEmail && <span className="text-xs text-[var(--rd-color-text-muted)]">{invoice.customerEmail}</span>}
          </span>
        ),
      },
      { id: "issuedAt", header: "Issued", sortable: true, hideOnMobile: true, value: (invoice) => new Date(`${invoice.issuedAt}T00:00:00Z`), cell: (invoice) => formatDay(invoice.issuedAt, locale) },
      {
        id: "dueAt",
        header: "Due",
        sortable: true,
        value: (invoice) => new Date(`${invoice.dueAt}T00:00:00Z`),
        cell: (invoice) => {
          const late = daysOverdue(invoice, day);
          return (
            <span className="flex flex-col">
              <span>{formatDay(invoice.dueAt, locale)}</span>
              {late > 0 && <span className="text-xs text-[var(--rd-color-text-muted)]">{plural(late, "day", "days")} overdue</span>}
            </span>
          );
        },
      },
      {
        id: "amount",
        header: "Amount",
        sortable: true,
        align: "end",
        value: (invoice) => invoice.amount,
        cell: (invoice) => <span className="tabular-nums">{money(invoice)}</span>,
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        value: (invoice) => invoiceStatusLabels[statusOf(invoice)],
        cell: (invoice) => (
          <Badge variant={tones[statusOf(invoice)]} size="sm">
            {invoiceStatusLabels[statusOf(invoice)]}
          </Badge>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, currency, day, statusTones],
  );

  const filters = useMemo<DataTableFilter<Invoice>[]>(
    () => [
      {
        id: "status",
        label: "Status",
        options: invoiceStatuses.map((value) => ({ value, label: invoiceStatusLabels[value] })),
        match: (invoice, value) => effectiveStatus(invoice, day) === value,
      },
    ],
    [day],
  );

  const rowActions = (invoice: Invoice): DataTableRowAction<Invoice>[] => {
    const status = statusOf(invoice);
    const actions: DataTableRowAction<Invoice>[] = [];
    if (onDownload) actions.push({ id: "download", label: "Download PDF", permission: permissions?.download, onAction: () => onDownload([invoice]) });
    if (onSendReminder && isUnpaid(status)) {
      actions.push({
        id: "remind",
        label: "Send reminder",
        permission: permissions?.remind,
        confirm: { title: `Send a reminder for ${invoice.number}?`, description: `${invoice.customer} gets an email about ${money(invoice)}.`, confirmLabel: "Send reminder" },
        onAction: () => onSendReminder([invoice]),
      });
    }
    if (onMarkPaid && isUnpaid(status)) {
      actions.push({
        id: "markPaid",
        label: "Record payment",
        permission: permissions?.markPaid,
        confirm: { title: `Record payment for ${invoice.number}?`, description: `${money(invoice)} from ${invoice.customer} is marked as paid.`, confirmLabel: "Record payment" },
        onAction: () => onMarkPaid(invoice),
      });
    }
    if (onVoid && isVoidable(status)) {
      actions.push({
        id: "void",
        label: "Void invoice",
        variant: "danger",
        permission: permissions?.void,
        confirm: { title: `Void ${invoice.number}?`, description: "A voided invoice can no longer be paid.", confirmLabel: "Void invoice" },
        onAction: () => onVoid(invoice),
      });
    }
    return actions;
  };

  const bulkActions: DataTableBulkAction<Invoice>[] = [];
  if (onSendReminder) {
    bulkActions.push({
      id: "remind",
      label: "Send reminders",
      permission: permissions?.remind,
      confirm: { title: "Send reminders for the selected invoices?", description: "Only unpaid invoices get one.", confirmLabel: "Send reminders" },
      onAction: (rows) => {
        const unpaid = rows.filter((invoice) => isUnpaid(statusOf(invoice)));
        return unpaid.length ? onSendReminder(unpaid) : undefined;
      },
    });
  }
  if (onDownload) bulkActions.push({ id: "download", label: "Download PDFs", permission: permissions?.download, onAction: (rows) => onDownload(rows) });

  // Totals above the table. With serverSide the table only sees one page, so "auto" would add up the wrong thing.
  const totals = summary === "none" || (summary === "auto" && serverSide) ? null : summary === "auto" ? summarize(invoices, currency, day) : summary;

  return (
    <div ref={ref} className={cx("flex w-full flex-col gap-4", className, classNames?.root)}>
      {totals && (
        <div className={cx("flex flex-col gap-2", classNames?.summary)}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              variant="card"
              size="md"
              label="Outstanding"
              value={formatMoney(totals.outstanding, totals.currency, locale)}
              summary="Open and overdue invoices"
              isLoading={isLoading}
              className={classNames?.stat}
            />
            <Stat
              variant="card"
              size="md"
              label="Overdue"
              value={formatMoney(totals.overdue, totals.currency, locale)}
              summary={totals.overdueCount === 0 ? "Nothing is late" : `${plural(totals.overdueCount, "invoice", "invoices")} past due`}
              isLoading={isLoading}
              className={classNames?.stat}
            />
            <Stat
              variant="card"
              size="md"
              label="Paid, last 30 days"
              value={formatMoney(totals.paidLast30Days, totals.currency, locale)}
              summary="Received in the last 30 days"
              isLoading={isLoading}
              className={classNames?.stat}
            />
          </div>
          <p className="text-xs text-[var(--rd-color-text-muted)]">
            Totals in {totals.currency}.{totals.skipped > 0 ? ` ${plural(totals.skipped, "invoice", "invoices")} in other currencies ${totals.skipped === 1 ? "is" : "are"} not included.` : ""}
          </p>
        </div>
      )}
      <DataTable<Invoice>
        {...rest}
        label={label}
        rows={invoices}
        columns={columns}
        getRowId={(invoice) => invoice.id}
        filters={filters}
        searchable={["number", "customer"]}
        searchPlaceholder="Search invoices"
        pageSize={pageSize}
        serverSide={serverSide}
        isLoading={isLoading}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        selectionMode={selectionMode ?? (bulkActions.length > 0 ? "multiple" : "none")}
        bulkActions={bulkActions}
        rowActions={onDownload || onSendReminder || onMarkPaid || onVoid ? rowActions : undefined}
        onRowOpen={permissionFor(permissions, "open").isAllowed ? onOpenInvoice : undefined}
        permissions={{ export: permissions?.export, select: permissions?.select }}
        classNames={classNames}
      />
    </div>
  );
});
