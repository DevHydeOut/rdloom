import type { ColumnDef } from "@tanstack/react-table";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { DataGrid, type DataGridCellEdit, type DataGridProps } from "../src";
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
  { id: "p5", name: "Alan", city: "London", age: 41 },
];

const columns: ColumnDef<Person, any>[] = [
  { accessorKey: "name", header: "Name", meta: { editable: true } },
  { accessorKey: "city", header: "City", meta: { filter: "select" } },
  { accessorKey: "age", header: "Age", meta: { align: "end", editable: true, editor: "number" } },
];

/** A grid that applies edits to its own data, like a real app would. */
function EditableGrid(props: Partial<DataGridProps<Person>> & { onEdit?: (e: DataGridCellEdit<Person>) => void }) {
  const [data, setData] = useState(people);
  return (
    <DataGrid
      label="People"
      data={data}
      columns={columns}
      getRowId={(p) => p.id}
      onCellEdit={(e) => {
        props.onEdit?.(e);
        setData((rows) => rows.map((r) => (r.id === e.rowId ? { ...r, [e.columnId]: e.value } : r)));
      }}
      {...props}
    />
  );
}

const grid = () => screen.getByRole("grid", { name: "People" });
// Data rows: skip the header (no gridcells) and the filter row (has inputs).
const dataRows = () =>
  within(grid())
    .getAllByRole("row")
    .filter((r) => within(r).queryAllByRole("gridcell").length > 0 && !r.querySelector('input[type="search"], select'));
const names = () => dataRows().map((r) => within(r).getAllByRole("gridcell")[0].textContent);

describe("DataGrid column filters", () => {
  it("adds a labelled filter row and counts it in aria-rowcount", () => {
    render(<EditableGrid showColumnFilters />);
    expect(screen.getByRole("searchbox", { name: "Filter Name" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filter City" })).toBeInTheDocument();
    expect(grid()).toHaveAttribute("aria-rowcount", "7"); // header + filter + 5
  });

  it("moves into a text filter by typing, filters, and returns with Escape", async () => {
    const user = userEvent.setup();
    render(<EditableGrid showColumnFilters />);

    await user.tab(); // first data cell
    await user.keyboard("{ArrowUp}"); // filter cell for Name
    await user.keyboard("a");
    const input = screen.getByRole("searchbox", { name: "Filter Name" });
    expect(input).toHaveFocus();
    await user.keyboard("l");
    expect(input).toHaveValue("al");
    expect(names()).toEqual(["Alan"]);

    await user.keyboard("{Escape}");
    expect(document.activeElement).toHaveAttribute("data-cell", "1:0");
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toHaveTextContent("Alan");
  });

  it("filters by a select option built from the column's values", async () => {
    const user = userEvent.setup();
    render(<EditableGrid showColumnFilters />);
    const select = screen.getByRole("combobox", { name: "Filter City" });
    expect(within(select).getAllByRole("option").map((o) => o.textContent)).toEqual(["All", "Boston", "Helsinki", "London", "New York"]);

    await user.selectOptions(select, "London");
    expect(names()).toEqual(["Ada", "Alan"]);
  });

  it("combines column filters with the global filter", async () => {
    const user = userEvent.setup();
    render(<EditableGrid showColumnFilters globalFilter="a" />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter City" }), "London");
    expect(names()).toEqual(["Ada", "Alan"]);
  });

  it("has no axe violations", async () => {
    render(<EditableGrid showColumnFilters selectionMode="multiple" />);
    expect(await axeViolations()).toEqual([]);
  });
});

describe("DataGrid editing", () => {
  it("edits with Enter, saves with Enter and returns focus to the cell", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<EditableGrid onEdit={onEdit} />);

    await user.tab();
    await user.keyboard("{Enter}");
    const editor = screen.getByRole("textbox", { name: "Edit Name" });
    expect(editor).toHaveFocus();
    expect(editor).toHaveValue("Ada");

    await user.keyboard("{Backspace}{Backspace}{Backspace}Ida{Enter}");
    expect(onEdit).toHaveBeenCalledWith({ rowId: "p1", columnId: "name", value: "Ida", row: people[0] });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(document.activeElement).toHaveTextContent("Ida");
  });

  it("starts with F2 and cancels with Escape", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<EditableGrid onEdit={onEdit} />);

    await user.tab();
    await user.keyboard("{F2}x{Escape}");
    expect(onEdit).not.toHaveBeenCalled();
    expect(document.activeElement).toHaveTextContent("Ada");
  });

  it("starts editing with the typed character, replacing the value", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<EditableGrid onEdit={onEdit} />);

    await user.tab();
    await user.keyboard("Zed{Enter}");
    expect(onEdit).toHaveBeenLastCalledWith(expect.objectContaining({ value: "Zed" }));
  });

  it("rejects non-numbers in a number editor and saves numbers as numbers", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<EditableGrid onEdit={onEdit} />);

    await user.tab();
    await user.keyboard("{End}{Enter}");
    const editor = screen.getByRole("textbox", { name: "Edit Age" });
    await user.clear(editor);
    await user.keyboard("abc{Enter}");
    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(onEdit).not.toHaveBeenCalled();

    await user.clear(editor);
    await user.keyboard("37{Enter}");
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ columnId: "age", value: 37 }));
  });

  it("edits on double-click; read-only cells keep the row action", async () => {
    const user = userEvent.setup();
    const onRowAction = vi.fn();
    render(<EditableGrid onRowAction={onRowAction} />);

    await user.dblClick(screen.getByText("Grace"));
    expect(screen.getByRole("textbox", { name: "Edit Name" })).toHaveValue("Grace");
    await user.keyboard("{Escape}");

    await user.dblClick(screen.getByText("Helsinki")); // City isn't editable
    expect(onRowAction).toHaveBeenCalledWith(people[2]);
    expect(screen.getByText("Helsinki").closest("[role=gridcell]")).toHaveAttribute("aria-readonly", "true");
  });

  it("keeps Space for selection when selection is on", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<EditableGrid selectionMode="multiple" onSelectionChange={onSelectionChange} />);
    await user.tab();
    await user.keyboard("{ArrowRight} "); // Name cell, editable
    expect(onSelectionChange).toHaveBeenLastCalledWith(["p1"]);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("has no axe violations while editing", async () => {
    const user = userEvent.setup();
    render(<EditableGrid />);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(await axeViolations()).toEqual([]);
  });
});

describe("DataGrid editing: IME and touch", () => {
  it("opens an empty editor on an IME's first key, without cancelling the composition", async () => {
    const user = userEvent.setup();
    render(<EditableGrid />);
    await user.tab(); // Ada, in the editable Name column

    // What a Japanese / Chinese / Korean IME sends first: no character yet.
    const key = new KeyboardEvent("keydown", { key: "Process", keyCode: 229, bubbles: true, cancelable: true });
    document.activeElement!.dispatchEvent(key);

    const editor = await screen.findByRole("textbox", { name: "Edit Name" });
    expect(editor).toHaveValue(""); // typing replaces the value, as with any character
    expect(key.defaultPrevented).toBe(false);
  });

  // Touch (tap the active cell to edit) is tested in real Chromium with touch
  // emulation: tests/visual/interactions.spec.ts. jsdom has no PointerEvent.

  it("doesn't edit on a mouse click of the active cell", async () => {
    const user = userEvent.setup();
    render(<EditableGrid />);
    const cell = within(dataRows()[0]).getAllByRole("gridcell")[0];
    await user.click(cell);
    await user.click(cell);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});

describe("DataGrid pagination", () => {
  it("shows one page, announces the range and pages with the pager", async () => {
    const user = userEvent.setup();
    render(<EditableGrid pageSize={2} />);

    expect(names()).toEqual(["Ada", "Grace"]);
    expect(screen.getByText("Rows 1–2 of 5")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(names()).toEqual(["Linus", "Margaret"]);
    expect(dataRows()[0]).toHaveAttribute("aria-rowindex", "4"); // absolute: header + rows 1-2 come first
    expect(screen.getByText("Rows 3–4 of 5")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Last page" }));
    expect(names()).toEqual(["Alan"]);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("keeps aria-rowcount at the full filtered count", () => {
    render(<EditableGrid pageSize={2} />);
    expect(grid()).toHaveAttribute("aria-rowcount", "6");
  });

  it("goes back to page 1 when the sort changes", async () => {
    const user = userEvent.setup();
    render(<EditableGrid pageSize={2} />);
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("columnheader", { name: "Age" }));
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(names()).toEqual(["Linus", "Ada"]); // 28, 36
  });

  it("has no axe violations", async () => {
    render(<EditableGrid pageSize={2} showColumnFilters />);
    expect(await axeViolations()).toEqual([]);
  });
});
