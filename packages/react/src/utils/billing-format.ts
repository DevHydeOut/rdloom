// Plain formatting for the billing and settings blocks. Dates are shown in UTC so the same date reads the
// same on the server and in the browser (no hydration mismatch, no off-by-one near midnight).

const toDate = (value: Date | string): Date => (value instanceof Date ? value : new Date(value));

/** "3 March 2027" for a Date or an ISO string; the string itself when it is not a date. */
export function formatDay(value: Date | string | null | undefined, locale = "en-US"): string {
  if (value === null || value === undefined) return "";
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

/** "$49" or "$49.50": whole amounts without decimals. */
export function formatPrice(amount: number, currency = "USD", locale = "en-US"): string {
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Up to one decimal: 4.2, 10, 1,250. */
export function formatAmount(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
}

export const intervalWord = (interval: "month" | "year") => (interval === "year" ? "year" : "month");
