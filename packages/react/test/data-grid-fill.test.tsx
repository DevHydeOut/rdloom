import type { ColumnDef } from "@tanstack/react-table";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataGrid, type DataGridCellEdit, type DataGridProps } from "../src";
import { extendValues } from "../src/data-grid/fill";
import { axeViolations } from "./axe";

describe("extendValues", () => {
  it("continues a steady run of numbers", () => {
    expect(extendValues([2, 4], 3)).toEqual([6, 8, 10]);
    expect(extendValues([10, 7], 2)).toEqual([4, 1]);
    expect(extendValues([1.5, 2], 2)).toEqual([2.5, 3]);
    expect(extendValues([0.1, 0.2], 2)).toEqual([0.3, 0.4]); // no 0.30000000000000004
  });

  it("copies a single number, and repeats an uneven run", () => {
    expect(extendValues([5], 3)).toEqual([5, 5, 5]);
    expect(extendValues([1, 2, 4], 4)).toEqual([1, 2, 4, 1]);
  });

  it("counts up text that ends in a number, keeping its prefix and width", () => {
    expect(extendValues(["Item 1"], 2)).toEqual(["Item 2", "Item 3"]);
    expect(extendValues(["Week 1", "Week 3"], 2)).toEqual(["Week 5", "Week 7"]);
    expect(extendValues(["ORD-0009"], 2)).toEqual(["ORD-0010", "ORD-0011"]);
    expect(extendValues(["Q1"], 1)).toEqual(["Q2"]);
  });

  it("repeats text when the prefixes differ or the count would go negative", () => {
    expect(extendValues(["A1", "B2"], 3)).toEqual(["A1", "B2", "A1"]);
    expect(extendValues(["Item 2", "Item 1"], 3)).toEqual(["Item 2", "Item 1", "Item 2"]); // 0, -1 ... would go negative
  });

  it("steps ISO dates by the gap between them", () => {
    expect(extendValues(["2026-01-05", "2026-01-12"], 2)).toEqual(["2026-01-19", "2026-01-26"]);
    expect(extendValues(["2026-01-30", "2026-01-31"], 2)).toEqual(["2026-02-01", "2026-02-02"]);
    expect(extendValues(["2026-03-01"], 2)).toEqual(["2026-03-02", "2026-03-03"]); // one date counts up a day at a time
    expect(extendValues(["2026-01-05", "2026-01-12", "2026-01-20"], 2)).toEqual(["2026-01-05", "2026-01-12"]); // uneven: repeat
  });

  it("repeats anything else", () => {
    expect(extendValues(["a", "b"], 5)).toEqual(["a", "b", "a", "b", "a"]);
    expect(extendValues([true, false], 3)).toEqual([true, false, true]);
    expect(extendValues([null, 3], 2)).toEqual([null, 3]);
  });

  it("without series, only repeats", () => {
    expect(extendValues([2, 4], 3, false)).toEqual([2, 4, 2]);
    expect(extendValues(["Item 1"], 2, false)).toEqual(["Item 1", "Item 1"]);
  });

  it("returns nothing for nothing", () => {
    expect(extendValues([1, 2], 0)).toEqual([]);
    expect(extendValues([], 3)).toEqual([]);
  });
});

interface Row {
  id: string;
  label: string;
  note: string;
  n: number;
}

const rows: Row[] = [
  { id: "r1", label: "Item 1", note: "alpha", n: 10 },
  { id: "r2", label: "Item 2", note: "beta", n: 20 },
  { id: "r3", label: "", note: "", n: 0 },
  { id: "r4", label: "", note: "", n: 0 },
  { id: "r5", label: "", note: "", n: 0 },
];

const columns: ColumnDef<Row, any>[] = [
  { accessorKey: "label", header: "Label", meta: { editable: true } },
  { accessorKey: "note", header: "Note" }, // read-only
  { accessorKey: "n", header: "N", meta: { editable: true, editor: "number" } },
];

function Grid(props: Partial<DataGridProps<Row>>) {
  const [data, setData] = useState(rows);
  return (
    <DataGrid
      label="Rows"
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      onCellsEdit={(edits) =>
        setData((all) => all.map((r) => ({ ...r, ...Object.fromEntries(edits.filter((e) => e.rowId === r.id).map((e) => [e.columnId, e.value])) })))
      }
      {...props}
    />
  );
}

const cell = (row: number, col: number) => document.querySelector<HTMLElement>(`[data-cell="${row}:${col}"]`)!;
const focusCell = (row: number, col: number) => act(() => cell(row, col).focus());
const column = (col: number) => [1, 2, 3, 4, 5].map((r) => cell(r, col).textContent);
const handles = () => document.querySelectorAll("[data-fill-handle]");

afterEach(() => {
  // @ts-expect-error: set by some tests
  delete document.elementFromPoint;
});

describe("DataGrid fill handle", () => {
  it("appears on the focused cell, only while the grid has focus", async () => {
    render(<Grid />);
    expect(handles()).toHaveLength(0);
    focusCell(1, 0);
    expect(handles()).toHaveLength(1);
    expect(cell(1, 0).contains(handles()[0])).toBe(true);
    await act(async () => cell(1, 0).blur());
    expect(handles()).toHaveLength(0);
  });

  it("moves to the corner of a selected block", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    focusCell(1, 0);
    await user.keyboard("{Shift>}{ArrowDown}{ArrowRight}{/Shift}");
    expect(cell(2, 1).contains(handles()[0])).toBe(true);
    expect(handles()).toHaveLength(1);
  });

  it("isn't there without an edit handler, or with fillHandle off", () => {
    const { unmount } = render(<DataGrid label="Rows" data={rows} columns={columns} getRowId={(r) => r.id} />);
    focusCell(1, 0);
    expect(handles()).toHaveLength(0);
    unmount();
    render(<Grid fillHandle={false} />);
    focusCell(1, 0);
    expect(handles()).toHaveLength(0);
  });

  /** Drags the handle from the focused selection to a cell, as a mouse would. */
  const drag = (to: [number, number]) => {
    document.elementFromPoint = () => cell(to[0], to[1]);
    fireEvent.mouseDown(handles()[0], { button: 0 });
    fireEvent.mouseMove(window, { clientX: 10, clientY: 10 });
  };

  it("fills down, continuing a series of numbers and counting up text", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    focusCell(1, 0);
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}"); // Item 1, Item 2
    drag([4, 0]);
    fireEvent.mouseUp(window);
    expect(column(0)).toEqual(["Item 1", "Item 2", "Item 3", "Item 4", ""]);
    expect(screen.getByText("2 cells filled")).toBeInTheDocument();
  });

  it("fills several columns at once, writing numbers as numbers and skipping read-only cells", async () => {
    const user = userEvent.setup();
    const onCellsEdit = vi.fn();
    render(<Grid onCellsEdit={onCellsEdit} />);
    focusCell(1, 0);
    await user.keyboard("{Shift>}{ArrowDown}{ArrowRight}{ArrowRight}{/Shift}"); // all three columns, two rows
    drag([4, 0]);
    fireEvent.mouseUp(window);
    const edits = onCellsEdit.mock.calls[0][0] as DataGridCellEdit<Row>[];
    expect(edits.map((e) => [e.rowId, e.columnId, e.value])).toEqual([
      ["r3", "label", "Item 3"],
      ["r4", "label", "Item 4"],
      ["r3", "n", 30],
      ["r4", "n", 40],
    ]);
    expect(screen.getByText("4 cells filled, 2 skipped")).toBeInTheDocument();
  });

  it("fills up, continuing the series backwards from the top of the selection", async () => {
    const user = userEvent.setup();
    const onCellsEdit = vi.fn();
    render(<Grid onCellsEdit={onCellsEdit} />);
    focusCell(2, 2);
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}"); // N of rows 2-3: 20, 0 (a step of -20 going down)
    drag([1, 2]);
    fireEvent.mouseUp(window);
    const edits = onCellsEdit.mock.calls[0][0] as DataGridCellEdit<Row>[];
    expect(edits.map((e) => [e.rowId, e.value])).toEqual([["r1", 40]]);
  });

  it("fills sideways, leftwards here, when the pointer has gone further across than down", () => {
    const onCellsEdit = vi.fn();
    render(<Grid onCellsEdit={onCellsEdit} />);
    focusCell(1, 2); // N = 10
    drag([2, 0]); // one row down, two columns left: left wins, and row 2 is left alone
    fireEvent.mouseUp(window);
    const edits = onCellsEdit.mock.calls[0][0] as DataGridCellEdit<Row>[];
    // The note column is read-only; the label column takes the number as text.
    expect(edits.map((e) => [e.rowId, e.columnId, e.value])).toEqual([["r1", "label", "10"]]);
    expect(screen.getByText("1 cell filled, 1 skipped")).toBeInTheDocument();
  });

  it("shows where the fill will go while dragging, and writes nothing until the button is released", async () => {
    const user = userEvent.setup();
    const onCellsEdit = vi.fn();
    render(<Grid onCellsEdit={onCellsEdit} />);
    focusCell(1, 0);
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    drag([4, 0]);
    expect(document.querySelectorAll("[data-fill]")).toHaveLength(2);
    expect(onCellsEdit).not.toHaveBeenCalled();
    fireEvent.mouseUp(window);
    expect(onCellsEdit).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll("[data-fill]")).toHaveLength(0);
  });

  it("Escape cancels a drag", async () => {
    const user = userEvent.setup();
    const onCellsEdit = vi.fn();
    render(<Grid onCellsEdit={onCellsEdit} />);
    focusCell(1, 0);
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    drag([4, 0]);
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.mouseUp(window);
    expect(onCellsEdit).not.toHaveBeenCalled();
    expect(document.querySelectorAll("[data-fill]")).toHaveLength(0);
  });

  it("releasing the button without moving writes nothing", () => {
    const onCellsEdit = vi.fn();
    render(<Grid onCellsEdit={onCellsEdit} />);
    focusCell(1, 0);
    fireEvent.mouseDown(handles()[0], { button: 0 });
    fireEvent.mouseUp(window);
    expect(onCellsEdit).not.toHaveBeenCalled();
  });

  it("selects what it filled", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    focusCell(1, 0);
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    drag([4, 0]);
    fireEvent.mouseUp(window);
    expect(document.querySelectorAll('[role="gridcell"][aria-selected="true"]')).toHaveLength(4);
  });
});

describe("DataGrid Ctrl+D and Ctrl+R", () => {
  it("Ctrl+D copies the top row of a selection down across it, repeating rather than counting", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    focusCell(1, 0);
    await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{ArrowDown}{/Shift}{Control>}d{/Control}");
    expect(column(0)).toEqual(["Item 1", "Item 1", "Item 1", "Item 1", ""]);
  });

  it("with no selection, Ctrl+D copies the cell above", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    focusCell(2, 0);
    await user.keyboard("{Control>}d{/Control}");
    expect(column(0).slice(0, 3)).toEqual(["Item 1", "Item 1", ""]);
    expect(screen.getByText("1 cell filled")).toBeInTheDocument();
  });

  it("does nothing on the first row, which has nothing above it", async () => {
    const user = userEvent.setup();
    const onCellsEdit = vi.fn();
    render(<Grid onCellsEdit={onCellsEdit} />);
    focusCell(1, 0);
    await user.keyboard("{Control>}d{/Control}");
    expect(onCellsEdit).not.toHaveBeenCalled();
  });

  it("Ctrl+R copies the left column across a selection", async () => {
    const user = userEvent.setup();
    const onCellsEdit = vi.fn();
    render(<Grid onCellsEdit={onCellsEdit} />);
    focusCell(1, 0);
    await user.keyboard("{Shift>}{ArrowRight}{ArrowRight}{/Shift}{Control>}r{/Control}");
    // The note column is read-only; the number column can't take the label text.
    expect(onCellsEdit).toHaveBeenCalledTimes(0);
    expect(screen.getByText("0 cells filled, 2 skipped")).toBeInTheDocument();
  });

  it("is left alone when fill is off, so the browser keeps Ctrl+D", () => {
    render(<Grid fillHandle={false} />);
    focusCell(2, 0);
    const notPrevented = fireEvent.keyDown(cell(2, 0), { key: "d", ctrlKey: true });
    expect(notPrevented).toBe(true);
  });

  it("is claimed from the browser when fill is on", () => {
    render(<Grid />);
    focusCell(2, 0);
    expect(fireEvent.keyDown(cell(2, 0), { key: "d", ctrlKey: true })).toBe(false);
  });

  it("leaves typing a plain d alone", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    focusCell(2, 0);
    await user.keyboard("d");
    expect(screen.getByLabelText("Edit Label")).toBeInTheDocument();
  });
});

describe("DataGrid fill accessibility", () => {
  it("has no axe violations with the handle showing", async () => {
    const user = userEvent.setup();
    const { container } = render(<Grid />);
    focusCell(1, 0);
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    expect(handles()).toHaveLength(1);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("keeps the handle out of the accessibility tree", () => {
    render(<Grid />);
    focusCell(1, 0);
    expect(handles()[0]).toHaveAttribute("aria-hidden", "true");
  });
});
