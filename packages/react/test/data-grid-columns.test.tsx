import type { ColumnDef } from "@tanstack/react-table";
import { act, createEvent, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DataGrid, reorderRows, type DataGridProps, type DataGridQuery, type DataGridRowMove } from "../src";
import { axeViolations } from "./axe";

interface Person {
  id: string;
  name: string;
  city: string;
  age: number;
}

const people: Person[] = [
  { id: "p1", name: "Ada", city: "London", age: 36 },
  { id: "p2", name: "Grace", city: "New York", age: 45 },
  { id: "p3", name: "Linus", city: "Helsinki", age: 28 },
  { id: "p4", name: "Margaret", city: "Boston", age: 52 },
];

const columns: ColumnDef<Person, any>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "city", header: "City", meta: { filter: "set" } },
  { accessorKey: "age", header: "Age", meta: { align: "end" } },
];

// hidden: an open popover makes the rest of the page aria-hidden.
const grid = () => screen.getByRole("grid", { name: "People", hidden: true });
const cell = (row: number, col: number) => document.querySelector<HTMLElement>(`[data-cell="${row}:${col}"]`)!;
const focusCell = (row: number, col: number) => act(() => cell(row, col).focus());
const headers = () => within(grid()).getAllByRole("columnheader").map((h) => h.textContent?.trim());
/** The first column of each data row (skips the header and filter rows). */
const firstColumn = (col = 0) =>
  within(grid())
    .getAllByRole("row", { hidden: true })
    .filter((r) => r.querySelector('[role="gridcell"]') && !r.querySelector("input, select, button[data-widget]"))
    .map((r) => within(r).getAllByRole("gridcell", { hidden: true })[col]?.textContent);

function Grid(props: Partial<DataGridProps<Person>>) {
  return <DataGrid label="People" data={people} columns={columns} getRowId={(p) => p.id} {...props} />;
}

describe("DataGrid column menu", () => {
  it("is off by default", () => {
    render(<Grid />);
    expect(screen.queryByRole("button", { name: /column menu/ })).toBeNull();
  });

  it("opens from the header's button and lists the actions", async () => {
    const user = userEvent.setup();
    render(<Grid columnMenu />);
    await user.click(screen.getByRole("button", { name: "Name column menu" }));
    const menu = screen.getByRole("menu", { name: "Name column menu" });
    expect(within(menu).getAllByRole("menuitem").map((i) => i.textContent)).toEqual([
      "Sort ascending",
      "Sort descending",
      "Pin to the left",
      "Reset width",
      "Hide column",
    ]);
  });

  it("sorts from the menu, and clicking the menu doesn't also sort the header", async () => {
    const user = userEvent.setup();
    render(<Grid columnMenu />);
    await user.click(screen.getByRole("button", { name: "Name column menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Sort descending" }));
    expect(firstColumn()).toEqual(["Margaret", "Linus", "Grace", "Ada"]);
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "descending");
    // The menu now offers to clear it.
    await user.click(screen.getByRole("button", { name: "Name column menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Clear sort" }));
    expect(firstColumn()).toEqual(["Ada", "Grace", "Linus", "Margaret"]);
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "none");
  });

  it("Alt+Down on a header opens its menu; Escape closes it and returns to the header", async () => {
    const user = userEvent.setup();
    render(<Grid columnMenu />);
    focusCell(0, 2);
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(screen.getByRole("menu", { name: "Age column menu" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(cell(0, 2)).toHaveFocus());
  });

  it("keys inside the menu don't move the grid's focus", async () => {
    const user = userEvent.setup();
    render(<Grid columnMenu />);
    focusCell(0, 1);
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowRight}");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(cell(0, 1)).toHaveFocus());
  });

  it("hides a column, and offers to show it again", async () => {
    const user = userEvent.setup();
    render(<Grid columnMenu />);
    await user.click(screen.getByRole("button", { name: "City column menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Hide column" }));
    expect(headers().join("|")).not.toContain("City");
    expect(firstColumn(1)).toEqual(["36", "45", "28", "52"]); // age moved up
    await user.click(screen.getByRole("button", { name: "Name column menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Show City" }));
    expect(headers().join("|")).toContain("City");
  });

  it("won't hide the last column", async () => {
    const user = userEvent.setup();
    render(<Grid columnMenu columns={[columns[0]]} />);
    await user.click(screen.getByRole("button", { name: "Name column menu" }));
    expect(screen.queryByRole("menuitem", { name: "Hide column" })).toBeNull();
  });

  it("pins and unpins a column", async () => {
    const user = userEvent.setup();
    render(<Grid columnMenu />);
    const age = () => screen.getByRole("columnheader", { name: /Age/ });
    expect(age().style.position).not.toBe("sticky");
    await user.click(screen.getByRole("button", { name: "Age column menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Pin to the left" }));
    expect(age().style.position).toBe("sticky");
    expect(age()).toHaveAttribute("aria-sort", "none");
    await user.click(screen.getByRole("button", { name: "Age column menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Unpin column" }));
    expect(age().style.position).not.toBe("sticky");
  });

  it("announces what it did", async () => {
    const user = userEvent.setup();
    render(<Grid columnMenu />);
    await user.click(screen.getByRole("button", { name: "City column menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Hide column" }));
    expect(screen.getByText("City hidden")).toBeInTheDocument();
  });

  it("has no axe violations with the menu open", async () => {
    const user = userEvent.setup();
    const { container } = render(<Grid columnMenu showColumnFilters />);
    await user.click(screen.getByRole("button", { name: "Name column menu" }));
    expect(await axeViolations(container)).toEqual([]);
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe("DataGrid set filter", () => {
  it("shows a summary and opens a checklist of the column's values", async () => {
    const user = userEvent.setup();
    render(<Grid showColumnFilters />);
    const button = screen.getByRole("button", { name: "Filter City" });
    expect(button).toHaveTextContent("All");
    await user.click(button);
    const list = screen.getByRole("listbox", { name: "Filter City" });
    expect(within(list).getAllByRole("option").map((o) => o.textContent)).toEqual(["Boston", "Helsinki", "London", "New York"]);
  });

  it("keeps rows whose value is any of the ticked ones", async () => {
    const user = userEvent.setup();
    render(<Grid showColumnFilters />);
    await user.click(screen.getByRole("button", { name: "Filter City" }));
    await user.click(screen.getByRole("option", { name: "London" }));
    await user.click(screen.getByRole("option", { name: "Boston" }));
    expect(firstColumn()).toEqual(["Ada", "Margaret"]);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.getByRole("button", { name: "Filter City", hidden: true })).toHaveTextContent("2 selected"));
  });

  it("clears the filter", async () => {
    const user = userEvent.setup();
    render(<Grid showColumnFilters />);
    await user.click(screen.getByRole("button", { name: "Filter City" }));
    await user.click(screen.getByRole("option", { name: "London" }));
    expect(firstColumn()).toEqual(["Ada"]);
    await user.click(screen.getByRole("button", { name: "Clear filter" }));
    expect(firstColumn()).toHaveLength(4);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.getByRole("button", { name: "Filter City", hidden: true })).toHaveTextContent("All"));
  });

  it("opens from the keyboard: Enter on the filter cell", async () => {
    const user = userEvent.setup();
    render(<Grid showColumnFilters />);
    focusCell(1, 1);
    await user.keyboard("{Enter}");
    expect(screen.getByRole("listbox", { name: "Filter City" })).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{ArrowDown} ");
    expect(firstColumn().length).toBeLessThan(4);
  });

  it("offers the values you give it, not just the loaded ones", async () => {
    const user = userEvent.setup();
    const cols: ColumnDef<Person, any>[] = [{ accessorKey: "city", header: "City", meta: { filter: "set", filterOptions: ["Delhi", "Rome"] } }];
    render(<Grid columns={cols} showColumnFilters />);
    await user.click(screen.getByRole("button", { name: "Filter City" }));
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Delhi", "Rome"]);
  });

  it("sends the ticked values to the server as an array", async () => {
    const user = userEvent.setup();
    const onQuery = vi.fn<(q: DataGridQuery) => void>();
    render(<Grid showColumnFilters serverSide pageSize={10} rowCount={4} queryDelay={10} onQueryChange={onQuery} />);
    await user.click(screen.getByRole("button", { name: "Filter City" }));
    await user.click(screen.getByRole("option", { name: "London" }));
    await waitFor(() => expect(onQuery.mock.calls.at(-1)![0].filters).toEqual([{ id: "city", value: ["London"] }]));
  });

  it("has no axe violations with the picker open", async () => {
    const user = userEvent.setup();
    render(<Grid showColumnFilters />);
    await user.click(screen.getByRole("button", { name: "Filter City" }));
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe("DataGrid row reorder", () => {
  /** jsdom's drag events carry no position, so give the event a clientY by hand. */
  const dragOver = (el: HTMLElement, dataTransfer: object, clientY: number) => {
    const event = createEvent.dragOver(el, { dataTransfer });
    Object.defineProperty(event, "clientY", { value: clientY });
    fireEvent(el, event);
  };
  const moves = () => {
    const seen: DataGridRowMove[] = [];
    return { seen, onRowReorder: (m: DataGridRowMove) => seen.push(m) };
  };

  it("adds a handle to every row, and a column header for it", () => {
    render(<Grid rowReorder />);
    expect(screen.getAllByRole("img", { name: /^Reorder / })).toHaveLength(4);
    expect(screen.getByRole("columnheader", { name: "Reorder" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Reorder Ada. Alt+Up or Alt+Down moves it." })).toHaveAttribute("draggable", "true");
  });

  it("Alt+Down moves a row down one place and announces it", async () => {
    const user = userEvent.setup();
    const { seen, onRowReorder } = moves();
    render(<Grid rowReorder onRowReorder={onRowReorder} />);
    focusCell(1, 1);
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(seen).toEqual([{ rowId: "p1", fromIndex: 0, toIndex: 1 }]);
    expect(screen.getByText("Moved Ada to position 2 of 4")).toBeInTheDocument();
  });

  it("focus follows the row it moved", async () => {
    const user = userEvent.setup();
    const { onRowReorder } = moves();
    function Stateful() {
      const [rows, setRows] = useState(people);
      return (
        <Grid
          data={rows}
          rowReorder
          onRowReorder={(m) => {
            onRowReorder(m);
            setRows((r) => reorderRows(r, m));
          }}
        />
      );
    }
    render(<Stateful />);
    focusCell(1, 1);
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await waitFor(() => expect(firstColumn(1)).toEqual(["Grace", "Ada", "Linus", "Margaret"]));
    await waitFor(() => expect(cell(2, 1)).toHaveFocus());
    expect(cell(2, 1)).toHaveTextContent("Ada");
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    await waitFor(() => expect(firstColumn(1)).toEqual(["Ada", "Grace", "Linus", "Margaret"]));
  });

  it("doesn't move past either end", async () => {
    const user = userEvent.setup();
    const { seen, onRowReorder } = moves();
    render(<Grid rowReorder onRowReorder={onRowReorder} />);
    focusCell(1, 1);
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    focusCell(4, 1);
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(seen).toEqual([]);
  });

  it("is off while the grid is sorted, and says so", async () => {
    const user = userEvent.setup();
    const { seen, onRowReorder } = moves();
    render(<Grid rowReorder onRowReorder={onRowReorder} defaultSorting={[{ id: "age", desc: false }]} />);
    expect(screen.getAllByRole("img", { name: /Reordering is off/ })).toHaveLength(4);
    expect(screen.getAllByRole("img", { name: /Reordering is off/ })[0]).toHaveAttribute("draggable", "false");
    focusCell(1, 1);
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(seen).toEqual([]);
  });

  it("is off while a search is active", () => {
    render(<Grid rowReorder globalFilter="a" />);
    expect(screen.getAllByRole("img", { name: /Reordering is off/ }).length).toBeGreaterThan(0);
  });

  it("dragging a handle onto the lower half of another row moves it after that row", () => {
    const { seen, onRowReorder } = moves();
    render(<Grid rowReorder onRowReorder={onRowReorder} />);
    const dataTransfer = { setData: vi.fn(), setDragImage: vi.fn(), effectAllowed: "", dropEffect: "" };
    const rows = within(grid()).getAllByRole("row").filter((r) => r.querySelector('[role="img"]'));
    fireEvent.dragStart(within(rows[0]).getByRole("img"), { dataTransfer });
    // jsdom has no layout: a row's box is empty, so clientY above 0 is its lower half.
    dragOver(rows[2], dataTransfer, 10);
    fireEvent.drop(rows[2], { dataTransfer });
    expect(seen).toEqual([{ rowId: "p1", fromIndex: 0, toIndex: 2 }]);
    expect(screen.getByText("Moved Ada to position 3 of 4")).toBeInTheDocument();
  });

  it("dragging onto the upper half of a row drops before it", () => {
    const { seen, onRowReorder } = moves();
    render(<Grid rowReorder onRowReorder={onRowReorder} />);
    const dataTransfer = { setData: vi.fn(), setDragImage: vi.fn(), effectAllowed: "", dropEffect: "" };
    const rows = within(grid()).getAllByRole("row").filter((r) => r.querySelector('[role="img"]'));
    fireEvent.dragStart(within(rows[3]).getByRole("img"), { dataTransfer });
    dragOver(rows[0], dataTransfer, 0);
    fireEvent.drop(rows[0], { dataTransfer });
    expect(seen).toEqual([{ rowId: "p4", fromIndex: 3, toIndex: 0 }]);
  });

  it("dropping a row where it already is reports nothing", () => {
    const { seen, onRowReorder } = moves();
    render(<Grid rowReorder onRowReorder={onRowReorder} />);
    const dataTransfer = { setData: vi.fn(), setDragImage: vi.fn(), effectAllowed: "", dropEffect: "" };
    const rows = within(grid()).getAllByRole("row").filter((r) => r.querySelector('[role="img"]'));
    fireEvent.dragStart(within(rows[1]).getByRole("img"), { dataTransfer });
    dragOver(rows[0], dataTransfer, 10); // after row 0 = where row 1 already is
    fireEvent.drop(rows[0], { dataTransfer });
    expect(seen).toEqual([]);
  });

  it("an abandoned drag leaves the order alone and clears the drop line", () => {
    const { seen, onRowReorder } = moves();
    render(<Grid rowReorder onRowReorder={onRowReorder} />);
    const dataTransfer = { setData: vi.fn(), setDragImage: vi.fn(), effectAllowed: "", dropEffect: "" };
    const rows = within(grid()).getAllByRole("row").filter((r) => r.querySelector('[role="img"]'));
    const handle = within(rows[0]).getByRole("img");
    fireEvent.dragStart(handle, { dataTransfer });
    dragOver(rows[2], dataTransfer, 10);
    expect(grid().querySelector(".h-0\\.5")).not.toBeNull();
    fireEvent.dragEnd(handle);
    expect(seen).toEqual([]);
    expect(grid().querySelector(".h-0\\.5")).toBeNull();
  });

  it("leaves the handle out of copy and export", async () => {
    const api = { current: null as import("../src").DataGridApi | null };
    render(<Grid rowReorder apiRef={api} />);
    expect(api.current!.getCsv().split("\r\n")[0]).toBe("Name,City,Age");
    focusCell(1, 1);
    const setData = vi.fn();
    fireEvent.copy(cell(1, 1), { clipboardData: { setData } });
    expect(setData).toHaveBeenCalledWith("text/plain", "Ada");
  });

  it("works together with row selection: handle first, then checkbox", () => {
    render(<Grid rowReorder selectionMode="multiple" />);
    const ids = within(grid()).getAllByRole("columnheader").slice(0, 2).map((h) => h.textContent?.trim() || h.querySelector("input")?.getAttribute("aria-label"));
    expect(ids).toEqual(["Reorder", "Select all rows"]);
  });

  it("reorderRows moves one item and leaves the original alone", () => {
    const rows = ["a", "b", "c", "d"];
    expect(reorderRows(rows, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(reorderRows(rows, { rowId: "d", fromIndex: 3, toIndex: 0 })).toEqual(["d", "a", "b", "c"]);
    expect(reorderRows(rows, 9, 0)).toEqual(rows);
    expect(rows).toEqual(["a", "b", "c", "d"]);
  });

  it("has no axe violations", async () => {
    const { container } = render(<Grid rowReorder columnMenu showColumnFilters />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
