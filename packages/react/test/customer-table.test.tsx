import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CustomerTable } from "../src/customer-table/customer-table";
import {
  applyQuery,
  customersToCsv,
  emptyQuery,
  filterCustomers,
  formatDate,
  formatMoney,
  pageCountOf,
  paginate,
  sortCustomers,
  summarize,
  type Customer,
} from "../src/customer-table/query";
import { axeViolations } from "./axe";

const plans = ["Free", "Pro", "Team"];
const statuses = ["active", "trial", "overdue", "churned"];
const customers: Customer[] = Array.from({ length: 24 }, (_, i) => ({
  id: `c${i + 1}`,
  name: `Person ${String(i + 1).padStart(2, "0")}`,
  email: `person${i + 1}@example.com`,
  company: i % 5 === 0 ? `Acme ${i + 1}` : undefined,
  plan: plans[i % 3],
  status: statuses[i % 4],
  mrr: [0, 29, 99][i % 3],
  joinedAt: `2026-0${1 + (i % 9)}-${String(1 + (i % 27)).padStart(2, "0")}`,
}));

describe("the logic behind the table", () => {
  it("searches name, email and company without caring about case", () => {
    const q = { search: "", status: [], plan: [] };
    expect(filterCustomers(customers, { ...q, search: "PERSON 03" }).map((c) => c.id)).toEqual(["c3"]);
    expect(filterCustomers(customers, { ...q, search: "person12@" }).map((c) => c.id)).toEqual(["c12"]);
    expect(filterCustomers(customers, { ...q, search: "acme 6" }).map((c) => c.id)).toEqual(["c6"]);
    expect(filterCustomers(customers, { ...q, search: "   " })).toHaveLength(24);
  });

  it("filters by status and plan, and both together", () => {
    const base = { search: "" };
    expect(filterCustomers(customers, { ...base, status: ["Overdue"], plan: [] }).every((c) => c.status === "overdue")).toBe(true);
    const both = filterCustomers(customers, { ...base, status: ["active"], plan: ["pro"] });
    expect(both.every((c) => c.status === "active" && c.plan === "Pro")).toBe(true);
    expect(filterCustomers(customers, { ...base, status: ["active", "trial"], plan: [] }).length).toBe(12);
  });

  it("sorts text naturally, money by value, dates by time, and keeps equal rows in order", () => {
    const rows: Customer[] = [
      { id: "a", name: "Plan 10", email: "", plan: "x", status: "s", mrr: 5, joinedAt: "2026-03-01" },
      { id: "b", name: "Plan 2", email: "", plan: "x", status: "s", mrr: 5, joinedAt: "2025-12-31" },
      { id: "c", name: "plan 1", email: "", plan: "x", status: "s", mrr: 100, joinedAt: "2026-01-15" },
    ];
    expect(sortCustomers(rows, { column: "name", direction: "ascending" }).map((r) => r.id)).toEqual(["c", "b", "a"]);
    expect(sortCustomers(rows, { column: "mrr", direction: "descending" }).map((r) => r.id)).toEqual(["c", "a", "b"]);
    expect(sortCustomers(rows, { column: "mrr", direction: "ascending" }).map((r) => r.id)).toEqual(["a", "b", "c"]);
    expect(sortCustomers(rows, { column: "joinedAt", direction: "ascending" }).map((r) => r.id)).toEqual(["b", "c", "a"]);
    expect(sortCustomers(rows, null)).toBe(rows);
    expect(rows.map((r) => r.id)).toEqual(["a", "b", "c"]); // the list you pass is never changed
  });

  it("pages: counts, slices, and clamps a page past the end", () => {
    expect(pageCountOf(0, 10)).toBe(1);
    expect(pageCountOf(25, 10)).toBe(3);
    expect(pageCountOf(5, 0)).toBe(5);
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
    expect(paginate([1, 2, 3, 4, 5], 99, 2)).toEqual([5]);
    expect(paginate([1, 2, 3], 0, 2)).toEqual([1, 2]);
  });

  it("runs search, filters, sort and page in the order people expect", () => {
    const result = applyQuery(customers, { ...emptyQuery(5), status: ["active"], sort: { column: "name", direction: "descending" }, page: 2 });
    expect(result.total).toBe(6);
    expect(result.rows.map((r) => r.name)).toEqual(["Person 01"]);
  });

  it("adds up customers and revenue, leaving churned customers out of revenue", () => {
    const s = summarize(customers);
    expect(s.total).toBe(24);
    expect(s.active).toBe(6);
    expect(s.churned).toBe(6);
    expect(s.mrr).toBe(customers.filter((c) => c.status !== "churned").reduce((n, c) => n + c.mrr, 0));
    expect(s.byPlan.map((p) => p.plan)).toEqual(["Free", "Pro", "Team"]);
    expect(summarize([]).byPlan).toEqual([]);
  });

  it("writes a CSV that spreadsheets can't run as formulas", () => {
    const csv = customersToCsv([{ id: "1", name: "=SUM(A1)", email: 'a,"b"@x.com', plan: "Pro", status: "active", mrr: 99, joinedAt: "2026-01-01" }]);
    expect(csv.split("\r\n")[0]).toBe("Name,Email,Company,Plan,Status,Monthly revenue,Joined");
    expect(csv.split("\r\n")[1]).toBe(`'=SUM(A1),"a,""b""@x.com",,Pro,active,99,2026-01-01`);
  });

  it("formats money and dates, and a calendar day never slips a day", () => {
    expect(formatMoney(1234.5, "USD", "en-US")).toBe("$1,235");
    expect(formatMoney(5, "NOPE", "en-US")).toContain("5");
    expect(formatDate("2026-03-01", "en-US")).toBe("Mar 1, 2026");
    expect(formatDate("not a date")).toBe("not a date");
  });
});

describe("CustomerTable", () => {
  afterEach(() => vi.useRealTimers());

  const rowsOf = () => within(screen.getByRole("grid", { name: "Customers" })).getAllByRole("row").slice(1);
  const nameCells = () => rowsOf().map((r) => within(r).getByRole("rowheader").textContent ?? "");

  it("is a labelled region with search, filters, a count and export", () => {
    render(<CustomerTable customers={customers} pageSize={8} />);
    expect(screen.getByRole("region", { name: "Customers" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search customers" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Status/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Plan/ })).toBeInTheDocument();
    expect(screen.getByText("24 customers")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeEnabled();
    expect(rowsOf()).toHaveLength(8);
    expect(screen.getByText("Showing 1 to 8 of 24")).toBeInTheDocument();
  });

  it("has a real table: a row header, named columns, money aligned right", () => {
    render(<CustomerTable customers={customers} pageSize={3} insights="none" currency="USD" locale="en-US" />);
    const table = screen.getByRole("grid", { name: "Customers" });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent?.trim())).toEqual(["Customer", "Plan", "Status", "Monthly revenue", "Joined"]);
    expect(within(table).getByRole("gridcell", { name: "$99" })).toHaveClass("!text-end");
    // status is words in a badge
    expect(within(rowsOf()[0]).getByText("active")).toBeInTheDocument();
  });

  it("filters as you type, announces the new count, and says when nothing matches", async () => {
    render(<CustomerTable customers={customers} pageSize={8} insights="none" />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Search customers" }), "person 03");
    expect(screen.getByText("1 customer")).toBeInTheDocument();
    expect(nameCells()[0]).toContain("Person 03");
    await userEvent.clear(screen.getByRole("searchbox"));
    await userEvent.type(screen.getByRole("searchbox"), "zzzz");
    expect(screen.getByText("No customers match")).toBeInTheDocument();
    expect(screen.queryByRole("grid")).toBeNull();
    await userEvent.click(within(screen.getByText("No customers match").closest("div")!.parentElement!).getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getByText("24 customers")).toBeInTheDocument();
  });

  it("filters by status from the list, and clears", async () => {
    render(<CustomerTable customers={customers} pageSize={50} insights="none" />);
    await userEvent.click(screen.getByRole("button", { name: /Status/ }));
    await userEvent.click(await screen.findByRole("option", { name: "overdue" }));
    expect(screen.getByText("6 customers")).toBeInTheDocument();
    expect(rowsOf().every((r) => within(r).queryByText("overdue"))).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("24 customers")).toBeInTheDocument();
  });

  it("sorts from a column header", async () => {
    render(<CustomerTable customers={customers} pageSize={50} insights="none" />);
    await userEvent.click(screen.getByRole("columnheader", { name: /Monthly revenue/ }));
    await userEvent.click(screen.getByRole("columnheader", { name: /Monthly revenue/ }));
    const first = within(rowsOf()[0]).getAllByRole("gridcell").map((c) => c.textContent);
    expect(first.some((t) => t?.includes("$99"))).toBe(true);
    expect(screen.getByRole("columnheader", { name: /Monthly revenue/ })).toHaveAttribute("aria-sort", "descending");
  });

  it("pages, and goes back to page one when the search changes", async () => {
    render(<CustomerTable customers={customers} pageSize={8} insights="none" />);
    await userEvent.click(screen.getByRole("button", { name: "Page 2" }));
    expect(screen.getByText("Showing 9 to 16 of 24")).toBeInTheDocument();
    expect(nameCells()[0]).toContain("Person 09");
    await userEvent.type(screen.getByRole("searchbox"), "person");
    expect(screen.getByText("Showing 1 to 8 of 24")).toBeInTheDocument();
  });

  it("shows no pages when everything fits", () => {
    render(<CustomerTable customers={customers.slice(0, 3)} insights="none" />);
    expect(screen.queryByRole("navigation", { name: /pages/ })).toBeNull();
    expect(screen.getByText("Showing 1 to 3 of 3")).toBeInTheDocument();
  });

  it("exports everyone who matches, not just the page, and says so", async () => {
    const create = vi.fn(() => "blob:x");
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<CustomerTable customers={customers} pageSize={5} insights="none" />);
    await userEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    const blob = (create.mock.calls[0] as unknown as [Blob])[0];
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(blob);
    });
    expect(text).toContain("Person 24");
    expect(await screen.findByText("Exported 24 customers to customers.csv")).toBeInTheDocument();
    click.mockRestore();
  });

  it("hands the matching customers and the query to onExport", async () => {
    const onExport = vi.fn();
    render(<CustomerTable customers={customers} pageSize={5} insights="none" onExport={onExport} />);
    await userEvent.type(screen.getByRole("searchbox"), "person 1");
    await userEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onExport.mock.calls[0][0].length).toBe(10); // "Person 10" to "Person 19"
    expect(onExport.mock.calls[0][1].search).toBe("person 1");
  });

  it("shows totals and a chart that follow the filters", async () => {
    render(<CustomerTable customers={customers} pageSize={8} />);
    const stats = () => screen.getAllByText(/./, { selector: "[class*=tabular-nums]" });
    expect(screen.getByText("Monthly revenue by plan")).toBeInTheDocument();
    expect(screen.getByText(/Customers: 24\./)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Plan/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Pro" }));
    expect(screen.getByText(/Customers: 8\./)).toBeInTheDocument();
    expect(stats().length).toBeGreaterThan(0);
  });

  it("hides the totals with insights none, and takes yours with a custom set", () => {
    const { rerender } = render(<CustomerTable customers={customers} insights="none" />);
    expect(screen.queryByText("Monthly revenue by plan")).toBeNull();
    rerender(
      <CustomerTable
        customers={customers}
        insights={{ stats: [{ label: "Trials", value: 36, description: "9 end this week" }], chart: { title: "Revenue, last 3 months", data: { labels: ["A", "B", "C"], series: [{ name: "Revenue", values: [1, 2, 3] }] } } }}
      />,
    );
    expect(screen.getByText(/Trials: 36\./)).toBeInTheDocument();
    expect(screen.getByText("Revenue, last 3 months")).toBeInTheDocument();
  });

  it("shows skeletons while loading, marks itself busy and waits", () => {
    render(<CustomerTable customers={[]} isLoading insights="none" />);
    expect(screen.getByRole("region", { name: "Customers" })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading customers")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeDisabled();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.queryByText("No customers yet")).toBeNull();
  });

  it("says when there are no customers at all", () => {
    render(<CustomerTable customers={[]} insights="none" />);
    expect(screen.getByText("No customers yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeDisabled();
  });

  it("shows an error with a way to retry, instead of the list", async () => {
    const onRetry = vi.fn();
    render(<CustomerTable customers={customers} error="The server did not answer." onRetry={onRetry} insights="none" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't load customers");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("starts from the query you give it", () => {
    render(<CustomerTable customers={customers} insights="none" defaultQuery={{ search: "person 2", sort: { column: "name", direction: "descending" } }} pageSize={50} />);
    expect(screen.getByRole("searchbox")).toHaveValue("person 2");
    expect(nameCells()[0]).toContain("Person 24"); // 20 to 24, newest name first
    expect(screen.getByText("5 customers")).toBeInTheDocument();
  });

  it("makes a name a button when you handle opening a customer", async () => {
    const onOpen = vi.fn();
    render(<CustomerTable customers={customers} insights="none" onOpenCustomer={onOpen} pageSize={3} />);
    await userEvent.click(screen.getAllByRole("button", { name: "Person 01" })[0]);
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "c1" }));
  });

  it("also has a phone layout: cards in a list, with a sort control", () => {
    render(<CustomerTable customers={customers} insights="none" pageSize={4} />);
    const list = screen.getByRole("list", { name: "Customers, as a list" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("button", { name: /Sort by/ })).toBeInTheDocument();
  });

  describe("with the list on a server", () => {
    it("shows exactly what it is given, counts from totalCount, and asks for the rest", async () => {
      const onQueryChange = vi.fn();
      render(<CustomerTable customers={customers.slice(0, 8)} totalCount={240} pageSize={8} serverSide onQueryChange={onQueryChange} />);
      expect(onQueryChange).not.toHaveBeenCalled(); // not on mount
      expect(screen.getByText("240 customers")).toBeInTheDocument();
      expect(screen.getByText("Showing 1 to 8 of 240")).toBeInTheDocument();
      expect(rowsOf()).toHaveLength(8);
      await userEvent.click(screen.getByRole("button", { name: "Page 2" }));
      expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, pageSize: 8 }));
    });

    it("waits for typing to pause before asking, and asks once", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const onQueryChange = vi.fn();
      render(<CustomerTable customers={customers.slice(0, 8)} totalCount={240} pageSize={8} serverSide onQueryChange={onQueryChange} />);
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "a" } });
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ab" } });
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "abc" } });
      expect(onQueryChange).not.toHaveBeenCalled();
      await act(async () => vi.advanceTimersByTime(300));
      expect(onQueryChange).toHaveBeenCalledTimes(1);
      expect(onQueryChange).toHaveBeenCalledWith(expect.objectContaining({ search: "abc", page: 1 }));
    });

    it("keeps a delayed search and a filter chosen meanwhile", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const onQueryChange = vi.fn();
      render(<CustomerTable customers={customers.slice(0, 8)} totalCount={240} pageSize={8} serverSide onQueryChange={onQueryChange} />);
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ada" } });
      await userEvent.click(screen.getByRole("button", { name: /Plan/ }));
      await userEvent.click(await screen.findByRole("option", { name: "Pro" }));
      await act(async () => vi.advanceTimersByTime(300));
      expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ search: "ada", plan: ["Pro"] }));
    });

    it("shows Export only when you handle it, and leaves out totals it can't know", () => {
      const { rerender } = render(<CustomerTable customers={customers.slice(0, 8)} totalCount={240} serverSide />);
      expect(screen.queryByRole("button", { name: "Export CSV" })).toBeNull();
      expect(screen.queryByText("Monthly revenue by plan")).toBeNull();
      rerender(<CustomerTable customers={customers.slice(0, 8)} totalCount={240} serverSide onExport={() => {}} />);
      expect(screen.getByRole("button", { name: "Export CSV" })).toBeEnabled();
    });
  });

  it("renders on the server", () => {
    const html = renderToString(<CustomerTable customers={customers} pageSize={3} />);
    expect(html).toContain("Person 01");
    expect(html).toContain("24 customers");
  });

  it("has no axe violations: normal, loading, empty, error, filtered to nothing", async () => {
    const view = render(<CustomerTable customers={customers} pageSize={8} />);
    const seen = await axeViolations(view.container);
    expect(seen).toEqual([]);
    view.rerender(<CustomerTable customers={[]} isLoading insights="none" />);
    expect(await axeViolations(view.container)).toEqual([]);
    view.rerender(<CustomerTable customers={[]} insights="none" />);
    expect(await axeViolations(view.container)).toEqual([]);
    view.rerender(<CustomerTable customers={customers} error="Boom" onRetry={() => {}} insights="none" />);
    expect(await axeViolations(view.container)).toEqual([]);
    view.rerender(<CustomerTable customers={customers} insights="none" />);
    await userEvent.type(screen.getByRole("searchbox"), "zzzz");
    expect(await axeViolations(view.container)).toEqual([]);
  }, 30_000);
});
