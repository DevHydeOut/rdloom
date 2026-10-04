import type { ColumnDef } from "@tanstack/react-table";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataGrid, type DataGridProps } from "../src";
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
  { accessorKey: "city", header: "City" },
  { accessorKey: "age", header: "Age", meta: { align: "end" } },
];

function Grid(props: Partial<DataGridProps<Person>>) {
  return <DataGrid label="People" data={people} columns={columns} getRowId={(p) => p.id} {...props} />;
}

const grid = () => screen.getByRole("grid", { name: "People" });
const bodyRows = () => within(grid()).getAllByRole("row").slice(1);
const column = (index: number) => bodyRows().map((r) => within(r).getAllByRole("gridcell")[index].textContent);
const header = (name: string) => screen.getByRole("columnheader", { name });

describe("DataGrid structure", () => {
  it("exposes the full row and column counts", () => {
    render(<Grid />);
    expect(grid()).toHaveAttribute("aria-rowcount", "5"); // header + 4
    expect(grid()).toHaveAttribute("aria-colcount", "3");
    expect(bodyRows()[0]).toHaveAttribute("aria-rowindex", "2");
  });

  it("shows the empty message from the spec default", () => {
    render(<Grid data={[]} />);
    expect(grid()).toHaveTextContent("No rows");
  });

  it("marks itself busy while loading", () => {
    render(<Grid isLoading />);
    expect(grid()).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });
});

describe("DataGrid sorting", () => {
  it("cycles ascending, descending, none on header click and sets aria-sort", async () => {
    const user = userEvent.setup();
    render(<Grid />);

    await user.click(header("Age"));
    expect(header("Age")).toHaveAttribute("aria-sort", "ascending");
    expect(column(2)).toEqual(["28", "36", "45", "52"]);

    await user.click(header("Age"));
    expect(header("Age")).toHaveAttribute("aria-sort", "descending");
    expect(column(2)).toEqual(["52", "45", "36", "28"]);

    await user.click(header("Age"));
    expect(header("Age")).toHaveAttribute("aria-sort", "none");
    expect(column(0)).toEqual(["Ada", "Grace", "Linus", "Margaret"]);
  });

  it("sorts naturally and locale-aware, with empty values last in both directions", async () => {
    const user = userEvent.setup();
    type Item = { id: string; name: string | null; qty: number | null };
    const items: Item[] = [
      { id: "a", name: "Item 10", qty: 3 },
      { id: "b", name: null, qty: null },
      { id: "c", name: "item 2", qty: 12 },
      { id: "d", name: "Émile", qty: 1 },
      { id: "e", name: "Zoë", qty: 2 },
    ];
    render(
      <DataGrid<Item>
        label="Items"
        data={items}
        getRowId={(i) => i.id}
        columns={[
          { accessorKey: "name", header: "Name", cell: (c) => c.getValue() ?? "—" },
          { accessorKey: "qty", header: "Qty", cell: (c) => c.getValue() ?? "—" },
        ]}
      />,
    );
    const names = () => within(screen.getByRole("grid")).getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("gridcell")[0].textContent);
    const qtys = () => within(screen.getByRole("grid")).getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("gridcell")[1].textContent);

    await user.click(screen.getByRole("columnheader", { name: "Name" }));
    expect(names()).toEqual(["Émile", "item 2", "Item 10", "Zoë", "—"]); // 2 before 10, É with E, case-insensitive
    await user.click(screen.getByRole("columnheader", { name: "Name" }));
    expect(names()).toEqual(["Zoë", "Item 10", "item 2", "Émile", "—"]); // empty still last

    await user.click(screen.getByRole("columnheader", { name: "Qty" }));
    expect(qtys()).toEqual(["1", "2", "3", "12", "—"]); // numeric, not "12" < "2"
  });

  it("sorts ISO dates chronologically and Date objects by time", async () => {
    const user = userEvent.setup();
    const events = [
      { id: "a", on: "2026-03-01T09:30:00Z", at: new Date("2026-03-01T09:30:00Z") },
      { id: "b", on: "2025-12-31", at: new Date("2025-12-31T00:00:00Z") },
      { id: "c", on: "2026-03-01", at: new Date("2026-03-01T00:00:00Z") },
      { id: "d", on: "2026-01-15T23:59:59.999Z", at: new Date("2026-01-15T23:59:59.999Z") },
    ];
    render(
      <DataGrid
        label="Events"
        data={events}
        getRowId={(e) => e.id}
        columns={[
          { accessorKey: "on", header: "On" },
          { accessorKey: "at", header: "At", cell: (c) => (c.getValue() as Date).toISOString() },
        ]}
      />,
    );
    const ids = () => within(screen.getByRole("grid")).getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("gridcell")[0].textContent);

    await user.click(screen.getByRole("columnheader", { name: "On" }));
    expect(ids()).toEqual(["2025-12-31", "2026-01-15T23:59:59.999Z", "2026-03-01", "2026-03-01T09:30:00Z"]);
    await user.click(screen.getByRole("columnheader", { name: "At" }));
    expect(ids()).toEqual(["2025-12-31", "2026-01-15T23:59:59.999Z", "2026-03-01", "2026-03-01T09:30:00Z"]);
  });

  it("keeps a column's custom sortingFn", async () => {
    const user = userEvent.setup();
    const bySize = ["S", "M", "L", "XL"];
    const shirts = ["L", "S", "XL", "M"].map((size, i) => ({ id: String(i), size }));
    render(
      <DataGrid
        label="Shirts"
        data={shirts}
        getRowId={(s) => s.id}
        columns={[
          {
            accessorKey: "size",
            header: "Size",
            sortingFn: (a, b) => bySize.indexOf(a.original.size) - bySize.indexOf(b.original.size),
          },
        ]}
      />,
    );
    await user.click(screen.getByRole("columnheader", { name: "Size" }));
    const sizes = within(screen.getByRole("grid")).getAllByRole("gridcell").map((c) => c.textContent);
    expect(sizes).toEqual(["S", "M", "L", "XL"]);
  });

  it("keeps the sort order while filtering, and when the filter changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Grid globalFilter="o" />); // London, New York, Boston
    await user.click(header("Age"));
    await user.click(header("Age")); // descending
    expect(column(2)).toEqual(["52", "45", "36"]); // Boston, New York, London

    rerender(<Grid globalFilter="on" />); // London, Boston
    expect(column(2)).toEqual(["52", "36"]);
    rerender(<Grid globalFilter="" />);
    expect(column(2)).toEqual(["52", "45", "36", "28"]);
  });

  it("sorts from the keyboard with Enter", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    header("City").focus();
    await user.keyboard("{Enter}");
    expect(column(1)).toEqual(["Boston", "Helsinki", "London", "New York"]);
  });

  it("does not sort when sortable is false", async () => {
    const user = userEvent.setup();
    render(<Grid sortable={false} />);
    await user.click(header("Age"));
    expect(header("Age")).not.toHaveAttribute("aria-sort");
    expect(column(0)).toEqual(["Ada", "Grace", "Linus", "Margaret"]);
  });
});

describe("DataGrid filtering", () => {
  it("filters rows by text in any cell and updates the row count", () => {
    const { rerender } = render(<Grid globalFilter="on" />);
    expect(column(0)).toEqual(["Ada", "Margaret"]); // LONDON, BOSTON
    expect(grid()).toHaveAttribute("aria-rowcount", "3");

    rerender(<Grid globalFilter="zzz" />);
    expect(grid()).toHaveTextContent("No rows");
  });

  it("shows and searches formatted values with meta.format", () => {
    const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    const orders = [
      { id: "o1", item: "Desk", total: 1901.74 },
      { id: "o2", item: "Lamp", total: 45 },
    ];
    const cols: ColumnDef<(typeof orders)[number], any>[] = [
      { accessorKey: "item", header: "Item" },
      { accessorKey: "total", header: "Total", meta: { format: money.format } },
    ];
    const { rerender } = render(<DataGrid label="People" data={orders} columns={cols} getRowId={(o) => o.id} />);
    expect(column(1)).toEqual(["$1,901.74", "$45.00"]);

    rerender(<DataGrid label="People" data={orders} columns={cols} getRowId={(o) => o.id} globalFilter="$1,901" />);
    expect(column(0)).toEqual(["Desk"]);
    rerender(<DataGrid label="People" data={orders} columns={cols} getRowId={(o) => o.id} globalFilter="1901.7" />); // raw still works
    expect(column(0)).toEqual(["Desk"]);
    rerender(<DataGrid label="People" data={orders} columns={cols} getRowId={(o) => o.id} globalFilter="74$" />); // no match across raw and shown
    expect(grid()).toHaveTextContent("No rows");
  });

  it("keeps a custom cell over meta.format", () => {
    const cols: ColumnDef<Person, any>[] = [{ accessorKey: "age", header: "Age", meta: { format: (v: number) => `${v} yrs` }, cell: (c) => `age ${c.getValue()}` }];
    render(<Grid columns={cols} globalFilter="36 yrs" />);
    expect(column(0)).toEqual(["age 36"]); // shown by the custom cell, found through format
  });

  it("reports the matching rows to the app, once per change", () => {
    const seen: string[][] = [];
    const onFilteredDataChange = (rows: Person[]) => seen.push(rows.map((r) => r.name));
    const { rerender } = render(<Grid onFilteredDataChange={onFilteredDataChange} />);
    rerender(<Grid onFilteredDataChange={onFilteredDataChange} globalFilter="on" />);
    rerender(<Grid onFilteredDataChange={(rows) => onFilteredDataChange(rows)} globalFilter="on" />); // new callback, same rows
    expect(seen).toEqual([["Ada", "Grace", "Linus", "Margaret"], ["Ada", "Margaret"]]);
  });
});

describe("DataGrid keyboard", () => {
  it("keeps one tab stop and moves with arrows, Home/End and Ctrl+Home/End", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button>before</button>
        <Grid />
      </>,
    );

    await user.tab();
    await user.tab(); // into the grid: first body cell
    const cell = () => document.activeElement!;
    expect(cell()).toHaveTextContent("Ada");
    expect(within(grid()).getAllByRole("gridcell").filter((c) => c.tabIndex === 0)).toHaveLength(1);

    await user.keyboard("{ArrowRight}");
    expect(cell()).toHaveTextContent("London");
    await user.keyboard("{ArrowDown}");
    expect(cell()).toHaveTextContent("New York");
    await user.keyboard("{End}");
    expect(cell()).toHaveTextContent("45");
    await user.keyboard("{Home}");
    expect(cell()).toHaveTextContent("Grace");
    await user.keyboard("{Control>}{End}{/Control}");
    expect(cell()).toHaveTextContent("52");
    await user.keyboard("{Control>}{Home}{/Control}");
    expect(cell()).toHaveAttribute("role", "columnheader");
    expect(cell()).toHaveTextContent("Name");
  });

  it("returns to the last focused cell when tabbing back in", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Grid />
        <button>after</button>
      </>,
    );
    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(document.activeElement).toHaveTextContent("New York");
    await user.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(document.activeElement).toHaveTextContent("New York");
  });

  it("calls onRowAction on Enter and double-click", async () => {
    const user = userEvent.setup();
    const onRowAction = vi.fn();
    render(<Grid onRowAction={onRowAction} />);

    await user.tab();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onRowAction).toHaveBeenLastCalledWith(people[1]);
    await user.dblClick(screen.getByText("Linus"));
    expect(onRowAction).toHaveBeenLastCalledWith(people[2]);
  });

  it("resizes a column with Alt+Arrow on its header", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    header("Name").focus();
    const before = parseFloat(header("Name").style.width);
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expect(parseFloat(header("Name").style.width)).toBe(before + 16);
    await user.keyboard("{Alt>}{ArrowLeft}{ArrowLeft}{/Alt}");
    expect(parseFloat(header("Name").style.width)).toBe(before - 16);
  });
});

describe("DataGrid selection", () => {
  it("toggles rows with Space and reports ids", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Grid selectionMode="multiple" onSelectionChange={onSelectionChange} />);

    await user.tab();
    await user.keyboard(" ");
    await user.keyboard("{ArrowDown} ");
    expect(onSelectionChange).toHaveBeenLastCalledWith(["p1", "p2"]);
    expect(bodyRows()[0]).toHaveAttribute("aria-selected", "true");
    expect(grid()).toHaveAttribute("aria-multiselectable", "true");

    await user.keyboard("{ArrowUp} ");
    expect(onSelectionChange).toHaveBeenLastCalledWith(["p2"]);
  });

  it("select-all acts on the filtered rows only", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Grid selectionMode="multiple" globalFilter="on" onSelectionChange={onSelectionChange} />);

    await user.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["p1", "p4"]);
    expect(screen.getByRole("checkbox", { name: "Select all rows" })).toBeChecked();
  });

  it("selects all with Ctrl+A", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Grid selectionMode="multiple" onSelectionChange={onSelectionChange} />);
    await user.tab();
    await user.keyboard("{Control>}a{/Control}");
    expect(onSelectionChange).toHaveBeenLastCalledWith(["p1", "p2", "p3", "p4"]);
  });

  it("keeps only one row in single mode", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Grid selectionMode="single" onSelectionChange={onSelectionChange} />);
    await user.tab();
    await user.keyboard(" {ArrowDown} ");
    expect(onSelectionChange).toHaveBeenLastCalledWith(["p2"]);
  });

  it("keeps the selection by id when sorting reorders rows", async () => {
    const user = userEvent.setup();
    render(<Grid selectionMode="multiple" defaultSelectedRowIds={["p3"]} />);
    await user.click(header("Age"));
    const selected = bodyRows().filter((r) => r.getAttribute("aria-selected") === "true");
    expect(selected.map((r) => within(r).getAllByRole("gridcell")[1].textContent)).toEqual(["Linus"]);
  });
});

describe("DataGrid pinning", () => {
  it("makes pinned columns sticky", () => {
    render(<Grid pinnedColumns={["name"]} />);
    expect(header("Name").style.position).toBe("sticky");
    expect(header("City").style.position).toBe("");
  });
});

describe("DataGrid virtualization", () => {
  const many: Person[] = Array.from({ length: 10_000 }, (_, i) => ({
    id: `r${i}`,
    name: `Person ${i + 1}`,
    city: "Nowhere",
    age: i % 90,
  }));

  it("renders only a window of rows but reports the full count", () => {
    render(<Grid data={many} height={400} />);
    expect(grid()).toHaveAttribute("aria-rowcount", "10001");
    expect(bodyRows().length).toBeGreaterThan(5);
    expect(bodyRows().length).toBeLessThan(40);
  });

  it("scrolls to and focuses the last row with Ctrl+End", async () => {
    const user = userEvent.setup();
    render(<Grid data={many} height={400} />);
    await user.tab();
    await user.keyboard("{Control>}{End}{/Control}");

    // The grid scrolls first and focuses the cell once that row renders, a
    // render or two later. Slower CI machines (Windows) need the wait.
    await waitFor(() => expect(document.activeElement?.closest("[role=row]")).toHaveAttribute("aria-rowindex", "10001"));
    const focused = document.activeElement!;
    const row = focused.closest("[role=row]") as HTMLElement;
    expect(focused.textContent).toBe("9"); // age of person 10,000: 9999 % 90
    expect(row).toHaveAttribute("aria-rowindex", "10001");
    expect(within(row).getAllByRole("gridcell")[0]).toHaveTextContent("Person 10000");
  });
});

describe("DataGrid accessibility", () => {
  it("has no axe violations", async () => {
    render(<Grid selectionMode="multiple" pinnedColumns={["name"]} defaultSelectedRowIds={["p2"]} />);
    expect(await axeViolations()).toEqual([]);
  });

  it("has no axe violations when empty", async () => {
    render(<Grid data={[]} />);
    expect(await axeViolations()).toEqual([]);
  });
});
