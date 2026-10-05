import type { ColumnDef } from "@tanstack/react-table";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DataGrid, type DataGridProps, type DataGridQuery } from "../src";
import { axeViolations } from "./axe";

interface Row {
  id: string;
  name: string;
  status: string;
}

const page = (start: number, n = 10): Row[] =>
  Array.from({ length: n }, (_, i) => ({ id: `r${start + i}`, name: `Name ${start + i}`, status: i % 2 ? "Open" : "Paid" }));

const columns: ColumnDef<Row, any>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "status", header: "Status", meta: { filter: "select", filterOptions: ["Open", "Paid", "Late"] } },
];

const grid = () => screen.getByRole("grid", { name: "Rows" });
const names = () =>
  within(grid())
    .getAllByRole("row")
    .filter((r) => r.querySelector('[role="gridcell"]') && !r.querySelector("input, select")) // data rows only
    .map((r) => within(r).queryAllByRole("gridcell")[0]?.textContent);

function Server(props: Partial<DataGridProps<Row>> & { onQuery?: (q: DataGridQuery) => void; start?: number }) {
  const [rows] = useState(() => page(props.start ?? 1));
  return (
    <DataGrid
      label="Rows"
      serverSide
      data={rows}
      rowCount={95}
      columns={columns}
      getRowId={(r) => r.id}
      pageSize={10}
      showColumnFilters
      queryDelay={30}
      onQueryChange={props.onQuery}
      {...props}
    />
  );
}

const lastQuery = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls.at(-1)?.[0] as DataGridQuery;

describe("DataGrid serverSide", () => {
  it("asks for the first page on mount", () => {
    const onQuery = vi.fn();
    render(<Server onQuery={onQuery} />);
    expect(onQuery).toHaveBeenCalledTimes(1);
    expect(onQuery).toHaveBeenCalledWith({ sorting: [], filters: [], search: "", pageIndex: 0, pageSize: 10 });
  });

  it("shows the rows it is given, and the pager reports the server's total", () => {
    render(<Server />);
    expect(names()).toEqual(page(1).map((r) => r.name));
    expect(screen.getByText("Rows 1–10 of 95")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 10")).toBeInTheDocument();
    // Assistive technology hears the full size, not the ten loaded rows.
    expect(grid()).toHaveAttribute("aria-rowcount", String(95 + 2));
  });

  it("numbers rows by their place in the whole result on a later page", async () => {
    const user = userEvent.setup();
    function Paged() {
      const [rows, setRows] = useState(() => page(1));
      return (
        <DataGrid
          label="Rows"
          serverSide
          data={rows}
          rowCount={95}
          columns={columns}
          getRowId={(r) => r.id}
          pageSize={10}
          onQueryChange={(q) => setRows(page(q.pageIndex * 10 + 1))}
        />
      );
    }
    render(<Paged />);
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(names()[0]).toBe("Name 11"));
    // Header is row 1, so the 11th result is row 12.
    expect(within(grid()).getAllByRole("row")[1]).toHaveAttribute("aria-rowindex", "12");
    expect(screen.getByText("Rows 11–20 of 95")).toBeInTheDocument();
  });

  it("sorting is the server's job: the grid reports it and keeps the order it was given", async () => {
    const user = userEvent.setup();
    const onQuery = vi.fn();
    render(<Server onQuery={onQuery} />);
    await user.click(screen.getByRole("columnheader", { name: /Name/ }));
    expect(lastQuery(onQuery).sorting).toEqual([{ id: "name", desc: false }]);
    expect(names()[0]).toBe("Name 1");
    await user.click(screen.getByRole("columnheader", { name: /Name/ }));
    expect(lastQuery(onQuery).sorting).toEqual([{ id: "name", desc: true }]);
    expect(names()[0]).toBe("Name 1"); // not re-sorted locally
  });

  it("filtering is the server's job: typing reports the text and keeps every row", async () => {
    const user = userEvent.setup();
    const onQuery = vi.fn();
    render(<Server onQuery={onQuery} />);
    await user.type(screen.getByLabelText("Filter Name"), "zzz");
    expect(names()).toHaveLength(10);
    await waitFor(() => expect(lastQuery(onQuery).filters).toEqual([{ id: "name", value: "zzz" }]));
  });

  it("waits for typing to pause: three keystrokes make one request", async () => {
    const onQuery = vi.fn();
    render(<Server onQuery={onQuery} queryDelay={80} />);
    const input = screen.getByLabelText("Filter Name");
    onQuery.mockClear();
    for (const text of ["a", "ab", "abc"]) fireEvent.change(input, { target: { value: text } });
    expect(onQuery).not.toHaveBeenCalled();
    await waitFor(() => expect(onQuery).toHaveBeenCalledTimes(1));
    expect(lastQuery(onQuery).filters).toEqual([{ id: "name", value: "abc" }]);
  });

  it("a select filter sends at once after the delay and offers the server's values", async () => {
    const user = userEvent.setup();
    const onQuery = vi.fn();
    render(<Server onQuery={onQuery} />);
    const select = screen.getByLabelText("Filter Status");
    // "Late" isn't in the loaded page; the column lists what the server said.
    expect(within(select).getAllByRole("option").map((o) => o.textContent)).toEqual(["All", "Open", "Paid", "Late"]);
    await user.selectOptions(select, "Late");
    await waitFor(() => expect(lastQuery(onQuery).filters).toEqual([{ id: "status", value: "Late" }]));
  });

  it("sends a search from the globalFilter prop", async () => {
    const onQuery = vi.fn();
    const { rerender } = render(<Server onQuery={onQuery} globalFilter="" />);
    onQuery.mockClear();
    rerender(<Server onQuery={onQuery} globalFilter="grace" />);
    await waitFor(() => expect(lastQuery(onQuery).search).toBe("grace"));
  });

  it("paging sends at once", async () => {
    const user = userEvent.setup();
    const onQuery = vi.fn();
    render(<Server onQuery={onQuery} queryDelay={5000} />);
    await user.click(screen.getByRole("button", { name: "Last page" }));
    expect(lastQuery(onQuery).pageIndex).toBe(9);
  });

  it("a new sort from page 3 asks for page 1 once, never for page 3 of the new sort", async () => {
    const user = userEvent.setup();
    const onQuery = vi.fn();
    render(<Server onQuery={onQuery} />);
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    onQuery.mockClear();
    await user.click(screen.getByRole("columnheader", { name: /Name/ }));
    await waitFor(() => expect(onQuery).toHaveBeenCalled());
    expect(onQuery.mock.calls.map((c) => [c[0].sorting.length, c[0].pageIndex])).toEqual([[1, 0]]);
  });

  it("keeps the selection of rows on other pages", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Server selectionMode="multiple" defaultSelectedRowIds={["r55"]} onSelectionChange={onSelectionChange} />);
    await user.click(within(grid()).getAllByRole("checkbox", { name: "Select row" })[0]);
    expect([...onSelectionChange.mock.calls.at(-1)![0]].sort()).toEqual(["r1", "r55"]);
  });

  it("falls back to the loaded rows when rowCount isn't given", () => {
    render(<Server rowCount={undefined} />);
    expect(screen.getByText("Rows 1–10 of 10")).toBeInTheDocument();
  });

  it("ignores groupBy and getSubRows, which need the whole dataset", () => {
    render(<Server groupBy={["status"]} getSubRows={() => undefined} />);
    expect(screen.getByRole("grid", { name: "Rows" })).toBeInTheDocument(); // not a treegrid
    expect(names()).toHaveLength(10);
  });

  it("accepts an async onQueryChange", async () => {
    // The handler's promise must not be mistaken for an effect cleanup.
    const onQuery = vi.fn(async () => {});
    render(<Server onQuery={onQuery} />);
    await waitFor(() => expect(onQuery).toHaveBeenCalled());
  });

  it("shows the loading state while you fetch", () => {
    render(<Server isLoading />);
    expect(grid()).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });

  it("does nothing special when serverSide is off", () => {
    const onQuery = vi.fn();
    render(<DataGrid label="Rows" data={page(1, 30)} columns={columns} getRowId={(r) => r.id} pageSize={10} onQueryChange={onQuery} />);
    expect(onQuery).not.toHaveBeenCalled();
    expect(screen.getByText("Rows 1–10 of 30")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Server />);
    await act(async () => {});
    expect(await axeViolations(container)).toEqual([]);
  });
});
