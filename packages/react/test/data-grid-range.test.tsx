import type { ColumnDef } from "@tanstack/react-table";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { crc32 } from "node:zlib";
import { describe, expect, it, vi } from "vitest";
import { DataGrid, type DataGridApi, type DataGridCellEdit, type DataGridProps } from "../src";
import { crc32 as ownCrc32, parseTsv, toCsv, toTsv, toXlsx } from "../src/data-grid/tabular";
import { axeViolations } from "./axe";

interface Person {
  id: string;
  name: string;
  city: string;
  age: number;
  salary: number;
}

const people: Person[] = [
  { id: "p1", name: "Ada", city: "London", age: 36, salary: 1200.5 },
  { id: "p2", name: "Grace", city: "New York", age: 45, salary: 980 },
  { id: "p3", name: "Linus", city: "Helsinki", age: 28, salary: 1500 },
  { id: "p4", name: "Margaret", city: "Boston", age: 52, salary: 700 },
];

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const columns: ColumnDef<Person, any>[] = [
  { accessorKey: "name", header: "Name", meta: { editable: true } },
  { accessorKey: "city", header: "City" },
  { accessorKey: "age", header: "Age", meta: { align: "end", editable: true, editor: "number" } },
  { accessorKey: "salary", header: "Salary", meta: { align: "end", format: money.format } },
];

function Grid(props: Partial<DataGridProps<Person>> & { initial?: Person[] }) {
  const [data, setData] = useState(props.initial ?? people);
  return (
    <DataGrid
      label="People"
      data={data}
      columns={columns}
      getRowId={(p) => p.id}
      onCellEdit={(e) => setData((rows) => rows.map((r) => (r.id === e.rowId ? { ...r, [e.columnId]: e.value } : r)))}
      {...props}
    />
  );
}

const cell = (row: number, col: number) => document.querySelector<HTMLElement>(`[data-cell="${row}:${col}"]`)!;
const focusCell = (row: number, col: number) => act(() => cell(row, col).focus());
const selectedCells = () => [...document.querySelectorAll('[role="gridcell"][aria-selected="true"]')].map((c) => c.textContent);
const copyFrom = (el: HTMLElement) => {
  const setData = vi.fn();
  fireEvent.copy(el, { clipboardData: { setData } });
  return setData;
};
const pasteInto = (el: HTMLElement, text: string) => fireEvent.paste(el, { clipboardData: { getData: () => text } });

describe("DataGrid range selection", () => {
  it("Shift+arrows extend a block, and Escape clears it", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    focusCell(1, 0);
    await user.keyboard("{Shift>}{ArrowDown}{ArrowRight}{/Shift}");
    expect(selectedCells()).toEqual(["Ada", "London", "Grace", "New York"]);
    expect(screen.getByText("4 cells selected")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(selectedCells()).toEqual([]);
  });

  it("a plain arrow key ends the block", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    focusCell(1, 0);
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}{ArrowRight}");
    expect(selectedCells()).toEqual([]);
  });

  it("Shift+click extends from the focused cell", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    await user.click(cell(1, 0));
    await user.keyboard("{Shift>}");
    await user.click(cell(3, 1));
    await user.keyboard("{/Shift}");
    expect(selectedCells()).toHaveLength(6);
  });

  it("dragging across cells selects a block", () => {
    render(<Grid />);
    fireEvent.mouseDown(cell(1, 0));
    fireEvent.mouseEnter(cell(2, 1));
    fireEvent.mouseUp(window);
    expect(selectedCells()).toEqual(["Ada", "London", "Grace", "New York"]);
    // The button is up: moving over more cells changes nothing.
    fireEvent.mouseEnter(cell(4, 3));
    expect(selectedCells()).toHaveLength(4);
  });

  it("can't extend into the header", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    focusCell(1, 0);
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}");
    expect(selectedCells()).toEqual([]);
    expect(cell(1, 0)).toHaveFocus();
  });

  it("Ctrl+A selects every cell when there are no row checkboxes", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    focusCell(1, 0);
    await user.keyboard("{Control>}a{/Control}");
    expect(selectedCells()).toHaveLength(people.length * columns.length);
  });

  it("does nothing when rangeSelection is off", async () => {
    const user = userEvent.setup();
    render(<Grid rangeSelection={false} />);
    focusCell(1, 0);
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    expect(selectedCells()).toEqual([]);
    expect(copyFrom(cell(1, 0))).not.toHaveBeenCalled();
  });
});

describe("DataGrid copy", () => {
  it("copies the focused cell when there is no block", () => {
    render(<Grid />);
    focusCell(2, 0);
    const setData = copyFrom(cell(2, 0));
    expect(setData).toHaveBeenCalledWith("text/plain", "Grace");
    expect(screen.getByText("1 cell copied")).toBeInTheDocument();
  });

  it("copies a block as tab-separated text, as the cells display it", async () => {
    const user = userEvent.setup();
    render(<Grid />);
    focusCell(1, 2);
    await user.keyboard("{Shift>}{ArrowDown}{ArrowRight}{/Shift}");
    const setData = copyFrom(cell(2, 3));
    expect(setData).toHaveBeenCalledWith("text/plain", "36\t$1,200.50\n45\t$980.00");
    expect(screen.getByText("4 cells copied")).toBeInTheDocument();
  });

  it("leaves the checkbox column out", async () => {
    const user = userEvent.setup();
    render(<Grid selectionMode="multiple" />);
    focusCell(1, 0);
    await user.keyboard("{Shift>}{ArrowRight}{ArrowRight}{/Shift}");
    expect(copyFrom(cell(1, 2))).toHaveBeenCalledWith("text/plain", "Ada\tLondon");
  });

  it("quotes values that hold tabs, quotes or line breaks", () => {
    expect(toTsv([['a\tb', 'say "hi"', "two\nlines", "plain"]])).toBe('"a\tb"\t"say ""hi"""\t"two\nlines"\tplain');
  });

  it("leaves a copy from a filter box or editor to the browser", () => {
    render(<Grid showColumnFilters />);
    const input = screen.getByLabelText("Filter Name");
    expect(copyFrom(input)).not.toHaveBeenCalled();
  });
});

describe("DataGrid paste", () => {
  it("pastes a block into editable cells from the focused cell", () => {
    const onCellsEdit = vi.fn();
    render(<Grid onCellsEdit={onCellsEdit} />);
    focusCell(1, 0);
    pasteInto(cell(1, 0), "Ann\tParis\t30\nBen\tRome\t41");
    // City is read-only: skipped. Name and Age are written.
    const edits = onCellsEdit.mock.calls[0][0] as DataGridCellEdit<Person>[];
    expect(edits.map((e) => [e.rowId, e.columnId, e.value])).toEqual([
      ["p1", "name", "Ann"],
      ["p1", "age", 30],
      ["p2", "name", "Ben"],
      ["p2", "age", 41],
    ]);
    expect(screen.getByText("4 cells pasted, 2 skipped")).toBeInTheDocument();
  });

  it("calls onCellEdit once per cell when onCellsEdit isn't set", () => {
    const seen: string[] = [];
    render(<Grid onCellEdit={(e) => seen.push(`${e.rowId}.${e.columnId}=${e.value}`)} />);
    focusCell(1, 0);
    pasteInto(cell(1, 0), "Ann\nBen");
    expect(seen).toEqual(["p1.name=Ann", "p2.name=Ben"]);
  });

  it("shows the pasted values in the grid", async () => {
    render(<Grid />);
    focusCell(1, 0);
    pasteInto(cell(1, 0), "Ann\nBen");
    await waitFor(() => expect(cell(2, 0)).toHaveTextContent("Ben"));
    expect(cell(1, 0)).toHaveTextContent("Ann");
  });

  it("one copied value fills the selected block", async () => {
    const user = userEvent.setup();
    const onCellsEdit = vi.fn();
    render(<Grid onCellsEdit={onCellsEdit} />);
    focusCell(1, 2);
    await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
    pasteInto(cell(3, 2), "99");
    expect((onCellsEdit.mock.calls[0][0] as DataGridCellEdit<Person>[]).map((e) => [e.rowId, e.value])).toEqual([
      ["p1", 99],
      ["p2", 99],
      ["p3", 99],
    ]);
  });

  it("skips text pasted into a number column instead of storing it", () => {
    const onCellsEdit = vi.fn();
    render(<Grid onCellsEdit={onCellsEdit} />);
    focusCell(1, 2);
    pasteInto(cell(1, 2), "abc\n\n41");
    expect((onCellsEdit.mock.calls[0][0] as DataGridCellEdit<Person>[]).map((e) => [e.rowId, e.value])).toEqual([["p3", 41]]);
    expect(screen.getByText("1 cell pasted, 2 skipped")).toBeInTheDocument();
  });

  it("clips a paste at the last row", () => {
    const onCellsEdit = vi.fn();
    render(<Grid onCellsEdit={onCellsEdit} />);
    focusCell(4, 0);
    pasteInto(cell(4, 0), "A\nB\nC");
    expect(onCellsEdit.mock.calls[0][0]).toHaveLength(1);
  });

  it("reads quoted fields and Windows line endings", () => {
    expect(parseTsv('"a\tb"\t"say ""hi"""\r\n"x\ny"\tz\r\n')).toEqual([
      ["a\tb", 'say "hi"'],
      ["x\ny", "z"],
    ]);
  });

  it("does nothing when the grid has no editable handler", () => {
    render(<DataGrid label="People" data={people} columns={columns} getRowId={(p) => p.id} />);
    focusCell(1, 0);
    const notPrevented = pasteInto(cell(1, 0), "Ann");
    expect(notPrevented).toBe(true); // not handled: the browser's default stands
  });

  it("leaves a paste into an editor to the browser", async () => {
    const user = userEvent.setup();
    const onCellsEdit = vi.fn();
    render(<Grid onCellsEdit={onCellsEdit} />);
    focusCell(1, 0);
    await user.keyboard("{Enter}");
    pasteInto(screen.getByLabelText("Edit Name"), "Ann");
    expect(onCellsEdit).not.toHaveBeenCalled();
  });
});

describe("DataGrid export", () => {
  const api = () => {
    const ref = createRef<DataGridApi>() as { current: DataGridApi | null };
    return ref;
  };

  it("exports the filtered rows with raw values", () => {
    const ref = api();
    render(<Grid apiRef={ref} globalFilter="London" />);
    expect(ref.current!.getCsv()).toBe("Name,City,Age,Salary\r\nAda,London,36,1200.5");
  });

  it("exports in the order the grid shows them", async () => {
    const user = userEvent.setup();
    const ref = api();
    render(<Grid apiRef={ref} />);
    await user.click(screen.getByRole("columnheader", { name: /Age/ }));
    expect(ref.current!.getCsv().split("\r\n").slice(1, 3)).toEqual(["Linus,Helsinki,28,1500", "Ada,London,36,1200.5"]);
  });

  it("exports only the selected rows when asked", async () => {
    const user = userEvent.setup();
    const ref = api();
    render(<Grid apiRef={ref} selectionMode="multiple" />);
    await user.click(within(cell(2, 0)).getByRole("checkbox"));
    expect(ref.current!.getCsv({ scope: "selected" })).toBe("Name,City,Age,Salary\r\nGrace,New York,45,980");
  });

  it("leaves the checkbox column out", () => {
    const ref = api();
    render(<Grid apiRef={ref} selectionMode="multiple" />);
    expect(ref.current!.getCsv().split("\r\n")[0]).toBe("Name,City,Age,Salary");
  });

  it("quotes commas and neutralises formulas", () => {
    const ref = api();
    render(<Grid apiRef={ref} initial={[{ id: "x", name: '=HYPERLINK("http://x")', city: "Paris, France", age: -5, salary: 1 }]} />);
    expect(ref.current!.getCsv()).toBe(`Name,City,Age,Salary\r\n"'=HYPERLINK(""http://x"")","Paris, France",-5,1`);
    expect(ref.current!.getCsv({ sanitize: false })).toContain('"=HYPERLINK(""http://x"")"');
  });

  it("downloads files with the grid's label as the name", () => {
    const clicked: { href: string; download: string }[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({ href: this.href, download: this.download });
    });
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    const ref = api();
    render(<Grid apiRef={ref} />);
    ref.current!.downloadCsv();
    ref.current!.downloadExcel({ fileName: "report" });
    expect(clicked.map((c) => c.download)).toEqual(["People.csv", "report.xlsx"]);
    click.mockRestore();
  });

  it("clears the api when the grid unmounts", () => {
    const ref = api();
    const { unmount } = render(<Grid apiRef={ref} />);
    expect(ref.current).not.toBeNull();
    unmount();
    expect(ref.current).toBeNull();
  });
});

describe("tabular helpers", () => {
  it("toCsv keeps numbers numeric and formats dates as ISO text", () => {
    expect(toCsv(["a", "b"], [[-1, new Date("2026-01-02T03:04:05Z")]])).toBe("a,b\r\n-1,2026-01-02T03:04:05.000Z");
  });

  it("crc32 matches Node's", () => {
    const bytes = new TextEncoder().encode("The quick brown fox jumps over the lazy dog");
    expect(ownCrc32(bytes)).toBe(crc32(bytes));
  });

  it("writes a zip that reads back: names, sizes and checksums", () => {
    const bytes = toXlsx("Sales: Q1/Q2", ["Name", "Amount"], [["A & B <c>", 12.5], ["", true]]);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const end = bytes.length - 22;
    expect(view.getUint32(end, true)).toBe(0x06054b50);
    const count = view.getUint16(end + 10, true);
    let at = view.getUint32(end + 16, true);
    const decoder = new TextDecoder();
    const parts: Record<string, string> = {};
    for (let i = 0; i < count; i++) {
      expect(view.getUint32(at, true)).toBe(0x02014b50);
      const crc = view.getUint32(at + 16, true);
      const size = view.getUint32(at + 20, true);
      const nameLength = view.getUint16(at + 28, true);
      const local = view.getUint32(at + 42, true);
      const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
      const start = local + 30 + view.getUint16(local + 26, true);
      const data = bytes.subarray(start, start + size);
      expect(crc32(data)).toBe(crc);
      parts[name] = decoder.decode(data);
      at += 46 + nameLength;
    }
    expect(Object.keys(parts).sort()).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/_rels/workbook.xml.rels",
      "xl/workbook.xml",
      "xl/worksheets/sheet1.xml",
    ]);
    expect(parts["xl/workbook.xml"]).toContain('name="Sales  Q1 Q2"'); // characters Excel forbids in a sheet name
    const sheet = parts["xl/worksheets/sheet1.xml"];
    expect(sheet).toContain('<c r="B2"><v>12.5</v></c>'); // numbers stay numbers
    expect(sheet).toContain("A &amp; B &lt;c&gt;"); // text is escaped
    expect(sheet).toContain('<c r="B3" t="b"><v>1</v></c>');
    expect(sheet).not.toContain('r="A3"'); // empty cells are left out
  });
});

describe("DataGrid range accessibility", () => {
  it("has no axe violations with a block selected", async () => {
    const user = userEvent.setup();
    const { container } = render(<Grid showColumnFilters />);
    focusCell(2, 0);
    await user.keyboard("{Shift>}{ArrowDown}{ArrowRight}{/Shift}");
    expect(selectedCells().length).toBe(4);
    expect(await axeViolations(container)).toEqual([]);
  });
});
