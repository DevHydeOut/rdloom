// The plain logic behind InvoicesTable: no React in here, so it is easy to test and to reuse on a server.

export type InvoiceStatus = "draft" | "open" | "overdue" | "paid" | "void";

/** One invoice. Amounts are in whole units of the currency (1240.5 means $1,240.50). Dates are ISO days, "2026-03-15". */
export interface Invoice {
  /** A stable id, such as the database id. */
  id: string;
  /** The number people read out and search for, e.g. "INV-1042". */
  number: string;
  /** Who is billed. */
  customer: string;
  customerEmail?: string;
  /** The day the invoice was sent. */
  issuedAt: string;
  /** The day payment is due. */
  dueAt: string;
  /** The day it was paid. Needed for the "paid in the last 30 days" total. */
  paidAt?: string;
  amount: number;
  /** An ISO currency code. Defaults to the table's currency. */
  currency?: string;
  /**
   * What the invoice is. An open invoice whose due day has passed is shown as overdue without you
   * setting it; send "overdue" yourself if your server already knows.
   */
  status: InvoiceStatus;
}

/** The totals above the table. */
export interface InvoiceSummary {
  /** Open and overdue invoices together. */
  outstanding: number;
  /** Overdue invoices only. */
  overdue: number;
  overdueCount: number;
  /** Invoices paid in the 30 days up to the as-of day. */
  paidLast30Days: number;
  /** The currency of the three amounts. */
  currency: string;
  /** How many invoices were left out because they are in another currency. */
  skipped: number;
}

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: "Draft",
  open: "Open",
  overdue: "Overdue",
  paid: "Paid",
  void: "Void",
};

export const invoiceStatuses = ["draft", "open", "overdue", "paid", "void"] as const satisfies readonly InvoiceStatus[];

/** Today as an ISO day in the visitor's time zone. */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const DAY = 86_400_000;
const dayNumber = (iso: string) => Math.floor(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / DAY);

/** Whole days from one ISO day to another: positive when `to` is later. */
export function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}

/** The status to show: an open invoice past its due day is overdue. */
export function effectiveStatus(invoice: Pick<Invoice, "status" | "dueAt">, asOf: string): InvoiceStatus {
  if (invoice.status === "open" && daysBetween(invoice.dueAt, asOf) > 0) return "overdue";
  return invoice.status;
}

/** How many days past due an unpaid invoice is, or 0. */
export function daysOverdue(invoice: Pick<Invoice, "status" | "dueAt">, asOf: string): number {
  const status = effectiveStatus(invoice, asOf);
  return status === "overdue" ? Math.max(0, daysBetween(invoice.dueAt, asOf)) : 0;
}

/** Can a reminder be sent, or the payment recorded? Only for unpaid invoices that were sent. */
export const isUnpaid = (status: InvoiceStatus) => status === "open" || status === "overdue";
/** Can the invoice still be voided? Paid and already void ones cannot. */
export const isVoidable = (status: InvoiceStatus) => status === "draft" || status === "open" || status === "overdue";

export function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    // An unknown currency code: show the number with the code rather than failing to render.
    return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${currency}`;
  }
}

export function formatDay(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The totals for the invoices in one currency. Invoices in other currencies are counted in `skipped`, never added in. */
export function summarize(invoices: readonly Invoice[], currency: string, asOf: string): InvoiceSummary {
  let outstanding = 0;
  let overdue = 0;
  let overdueCount = 0;
  let paid = 0;
  let skipped = 0;
  for (const invoice of invoices) {
    if ((invoice.currency ?? currency) !== currency) {
      skipped += 1;
      continue;
    }
    const status = effectiveStatus(invoice, asOf);
    if (isUnpaid(status)) outstanding += invoice.amount;
    if (status === "overdue") {
      overdue += invoice.amount;
      overdueCount += 1;
    }
    if (status === "paid" && invoice.paidAt) {
      const ago = daysBetween(invoice.paidAt, asOf);
      if (ago >= 0 && ago <= 30) paid += invoice.amount;
    }
  }
  return { outstanding: round2(outstanding), overdue: round2(overdue), overdueCount, paidLast30Days: round2(paid), currency, skipped };
}
