import { describe, expect, it } from "vitest";
import { daysBetween, daysOverdue, effectiveStatus, formatDay, formatMoney, isUnpaid, isVoidable, summarize, todayIso, type Invoice } from "../src/invoices-table/query";

const base = { customer: "Northgate Foods", issuedAt: "2026-02-01", currency: undefined };
const invoice = (patch: Partial<Invoice>): Invoice => ({ id: "i", number: "INV-1", dueAt: "2026-03-01", amount: 100, status: "open", ...base, ...patch });

describe("invoice dates", () => {
  it("counts whole days between two ISO days, across month ends and leap days", () => {
    expect(daysBetween("2026-03-01", "2026-03-15")).toBe(14);
    expect(daysBetween("2026-03-15", "2026-03-01")).toBe(-14);
    expect(daysBetween("2026-01-31", "2026-03-01")).toBe(29);
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
    expect(daysBetween("2026-03-15", "2026-03-15")).toBe(0);
  });

  it("writes today as a local ISO day", () => {
    expect(todayIso(new Date(2026, 2, 5, 23, 59))).toBe("2026-03-05");
    expect(todayIso(new Date(2026, 11, 31, 0, 0))).toBe("2026-12-31");
  });

  it("formats a day in the locale without moving it across time zones", () => {
    expect(formatDay("2026-03-01", "en-US")).toBe("Mar 1, 2026");
    expect(formatDay("2026-03-01", "de-DE")).toBe("01.03.2026");
  });
});

describe("effectiveStatus", () => {
  it("shows an open invoice as overdue the day after it was due, not on the due day", () => {
    expect(effectiveStatus(invoice({ dueAt: "2026-03-14" }), "2026-03-15")).toBe("overdue");
    expect(effectiveStatus(invoice({ dueAt: "2026-03-15" }), "2026-03-15")).toBe("open");
    expect(effectiveStatus(invoice({ dueAt: "2026-03-16" }), "2026-03-15")).toBe("open");
  });

  it("leaves every other status alone, even long past the due day", () => {
    for (const status of ["draft", "paid", "void"] as const) expect(effectiveStatus(invoice({ status, dueAt: "2020-01-01" }), "2026-03-15")).toBe(status);
  });

  it("keeps an overdue status the server already set", () => {
    expect(effectiveStatus(invoice({ status: "overdue", dueAt: "2026-04-01" }), "2026-03-15")).toBe("overdue");
  });

  it("counts the days overdue only for overdue invoices", () => {
    expect(daysOverdue(invoice({ dueAt: "2026-03-01" }), "2026-03-15")).toBe(14);
    expect(daysOverdue(invoice({ dueAt: "2026-03-20" }), "2026-03-15")).toBe(0);
    expect(daysOverdue(invoice({ status: "paid", dueAt: "2026-03-01" }), "2026-03-15")).toBe(0);
  });

  it("knows which statuses can be chased and which can be voided", () => {
    expect(["draft", "open", "overdue", "paid", "void"].map((s) => isUnpaid(s as never))).toEqual([false, true, true, false, false]);
    expect(["draft", "open", "overdue", "paid", "void"].map((s) => isVoidable(s as never))).toEqual([true, true, true, false, false]);
  });
});

describe("formatMoney", () => {
  it("formats for the currency and the locale", () => {
    expect(formatMoney(1240.5, "USD", "en-US")).toBe("$1,240.50");
    expect(formatMoney(1240.5, "EUR", "de-DE").replace(/\s/g, " ")).toBe("1.240,50 €");
    expect(formatMoney(0, "GBP", "en-GB")).toBe("£0.00");
  });

  it("shows the number and the code when the currency code is not valid, instead of failing", () => {
    expect(formatMoney(1240.5, "US", "en-US")).toBe("1,240.50 US");
  });
});

describe("summarize", () => {
  const asOf = "2026-03-15";
  const list: Invoice[] = [
    invoice({ id: "a", amount: 1000, status: "open", dueAt: "2026-03-01" }), // overdue by 14 days
    invoice({ id: "b", amount: 500, status: "open", dueAt: "2026-04-01" }), // open
    invoice({ id: "c", amount: 250.25, status: "paid", paidAt: "2026-03-10" }), // paid 5 days ago
    invoice({ id: "d", amount: 999, status: "paid", paidAt: "2026-01-01" }), // paid long ago
    invoice({ id: "e", amount: 40, status: "draft" }),
    invoice({ id: "f", amount: 70, status: "open", dueAt: "2026-04-01", currency: "EUR" }),
    invoice({ id: "g", amount: 5, status: "void" }),
  ];

  it("adds up what is outstanding, overdue and paid in the last 30 days", () => {
    expect(summarize(list, "USD", asOf)).toEqual({ outstanding: 1500, overdue: 1000, overdueCount: 1, paidLast30Days: 250.25, currency: "USD", skipped: 1 });
  });

  it("never adds another currency in, and says how many it left out", () => {
    const inDollars = list.map((i) => ({ ...i, currency: i.currency ?? "USD" }));
    const euros = summarize(inDollars, "EUR", asOf);
    expect(euros.outstanding).toBe(70);
    expect(euros.skipped).toBe(6);
  });

  it("counts an invoice with no currency in the currency of the table", () => {
    expect(summarize([invoice({ amount: 10, dueAt: "2026-05-01" })], "EUR", asOf)).toMatchObject({ outstanding: 10, skipped: 0 });
  });

  it("includes a payment made exactly 30 days ago and leaves out 31", () => {
    const paid = (day: string) => summarize([invoice({ status: "paid", paidAt: day, amount: 10 })], "USD", asOf).paidLast30Days;
    expect(paid("2026-02-13")).toBe(10);
    expect(paid("2026-02-12")).toBe(0);
    expect(paid("2026-03-16")).toBe(0); // paid in the future: not counted
  });

  it("does not drift when many small amounts are added", () => {
    const many = Array.from({ length: 10 }, (_, i) => invoice({ id: String(i), amount: 0.1, status: "open", dueAt: "2026-05-01" }));
    expect(summarize(many, "USD", asOf).outstanding).toBe(1);
  });

  it("is all zeros for no invoices", () => {
    expect(summarize([], "USD", asOf)).toEqual({ outstanding: 0, overdue: 0, overdueCount: 0, paidLast30Days: 0, currency: "USD", skipped: 0 });
  });
});
