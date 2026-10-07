import { describe, expect, it } from "vitest";
import {
  applyDataTableQuery,
  cellValue,
  completeQuery,
  dataTableQueryFromState,
  dataTableQuerySchema,
  dataTableQueryToState,
  emptyDataTableQuery,
  filterCount,
  filterRows,
  isFiltered,
  normalizeOptions,
  pageCountOf,
  paginate,
  rowsToCsv,
  searchRows,
  sortRows,
  type DataTableColumn,
  type DataTableFilter,
} from "../src/data-table/query";
import { parseQueryState, serializeQueryState } from "../src/utils/url-state";

interface Invoice {
  id: string;
  name: string;
  status: string;
  amount: number | null;
  due: Date;
  note?: string;
}

const invoices: Invoice[] = [
  { id: "a", name: "Plan 10", status: "Paid", amount: 5, due: new Date("2026-03-01"), note: "first" },
  { id: "b", name: "Plan 2", status: "Open", amount: 5, due: new Date("2025-12-31") },
  { id: "c", name: "plan 1", status: "paid", amount: 100, due: new Date("2026-01-15"), note: "=SUM(A1)" },
  { id: "d", name: "Other, Inc", status: "Late", amount: null, due: new Date("2026-02-01") },
];
const columns: DataTableColumn<Invoice>[] = [
  { id: "name", header: "Name", sortable: true },
  { id: "status", header: "Status" },
  { id: "amount", header: "Amount", sortable: true },
  { id: "due", header: "Due", sortable: true },
  { id: "note", header: "Note" },
];
const filters: DataTableFilter<Invoice>[] = [{ id: "status", label: "Status", options: ["Paid", "Open", "Late"] }];
const ids = (rows: Invoice[]) => rows.map((r) => r.id);

describe("reading values", () => {
  it("reads the column's value, or the field with the column's id", () => {
    expect(cellValue(invoices[0], columns[0])).toBe("Plan 10");
    expect(cellValue(invoices[0], { id: "x", header: "X", value: (r) => r.amount! * 2 })).toBe(10);
    expect(cellValue(invoices[3], columns[2])).toBeNull();
    expect(cellValue(invoices[1], columns[4])).toBeUndefined();
  });
});

describe("search", () => {
  it("looks in every column, ignoring case, or only the columns named", () => {
    expect(ids(searchRows(invoices, columns, "PLAN 2"))).toEqual(["b"]);
    expect(ids(searchRows(invoices, columns, "paid"))).toEqual(["a", "c"]);
    expect(ids(searchRows(invoices, columns, "paid", ["name"]))).toEqual([]);
    expect(ids(searchRows(invoices, columns, "first", ["note"]))).toEqual(["a"]);
    expect(searchRows(invoices, columns, "   ")).toBe(invoices);
  });
});

describe("filters", () => {
  it("passes rows with any chosen value, by the column's value, ignoring case", () => {
    expect(ids(filterRows(invoices, columns, filters, { status: ["paid"] }))).toEqual(["a", "c"]);
    expect(ids(filterRows(invoices, columns, filters, { status: ["Open", "Late"] }))).toEqual(["b", "d"]);
    expect(filterRows(invoices, columns, filters, { status: [] })).toBe(invoices);
    expect(filterRows(invoices, columns, filters, {})).toBe(invoices);
  });

  it("uses your own match, and all filters together", () => {
    const big: DataTableFilter<Invoice> = { id: "size", label: "Size", options: ["big"], match: (row, v) => v === "big" && (row.amount ?? 0) > 50 };
    expect(ids(filterRows(invoices, columns, [...filters, big], { size: ["big"] }))).toEqual(["c"]);
    expect(ids(filterRows(invoices, columns, [...filters, big], { size: ["big"], status: ["Open"] }))).toEqual([]);
  });

  it("accepts options as text or as { value, label }", () => {
    expect(normalizeOptions(["a", { value: "b", label: "Bee" }])).toEqual([
      { value: "a", label: "a" },
      { value: "b", label: "Bee" },
    ]);
  });

  it("knows when something is filtered", () => {
    expect(isFiltered(emptyDataTableQuery())).toBe(false);
    expect(isFiltered({ search: " x ", filters: {} })).toBe(true);
    expect(isFiltered({ search: "", filters: { status: [] } })).toBe(false);
    expect(isFiltered({ search: "", filters: { status: ["a"] } })).toBe(true);
    expect(filterCount({ a: ["x"], b: [], c: ["y", "z"] })).toBe(2);
  });
});

describe("sorting", () => {
  it("sorts text naturally, numbers and dates by value, and keeps equal rows in order", () => {
    expect(ids(sortRows(invoices, columns, { column: "name", direction: "ascending" }))).toEqual(["d", "c", "b", "a"]);
    expect(ids(sortRows(invoices, columns, { column: "amount", direction: "ascending" }))).toEqual(["a", "b", "c", "d"]);
    expect(ids(sortRows(invoices, columns, { column: "amount", direction: "descending" }))).toEqual(["c", "a", "b", "d"]);
    expect(ids(sortRows(invoices, columns, { column: "due", direction: "ascending" }))).toEqual(["b", "c", "d", "a"]);
  });

  it("puts empty values last in either direction", () => {
    expect(sortRows(invoices, columns, { column: "amount", direction: "descending" }).at(-1)!.id).toBe("d");
    expect(sortRows(invoices, columns, { column: "amount", direction: "ascending" }).at(-1)!.id).toBe("d");
    expect(ids(sortRows(invoices, columns, { column: "note", direction: "ascending" }))).toEqual(["c", "a", "b", "d"]);
  });

  it("never changes the list you pass, and ignores an unknown column", () => {
    const before = ids(invoices);
    sortRows(invoices, columns, { column: "name", direction: "descending" });
    expect(ids(invoices)).toEqual(before);
    expect(sortRows(invoices, columns, null)).toBe(invoices);
    expect(sortRows(invoices, columns, { column: "nope", direction: "ascending" })).toBe(invoices);
  });

  it("is stable: a repeated sort gives the same order", () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({ id: String(i), name: "same", status: "", amount: i % 3, due: new Date(0) }));
    const sorted = sortRows(rows, columns, { column: "amount", direction: "ascending" });
    const again = sortRows(sorted, columns, { column: "amount", direction: "ascending" });
    expect(ids(again)).toEqual(ids(sorted));
    const zeros = sorted.filter((r) => r.amount === 0).map((r) => Number(r.id));
    expect(zeros).toEqual([...zeros].sort((a, b) => a - b));
  });
});

describe("pages", () => {
  it("counts, slices, and clamps a page past the end", () => {
    expect(pageCountOf(0, 10)).toBe(1);
    expect(pageCountOf(25, 10)).toBe(3);
    expect(pageCountOf(5, 0)).toBe(5);
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
    expect(paginate([1, 2, 3, 4, 5], 99, 2)).toEqual([5]);
    expect(paginate([1, 2, 3], 0, 2)).toEqual([1, 2]);
  });
});

describe("the whole query", () => {
  it("searches and filters, then sorts, then pages, and reports every match", () => {
    const result = applyDataTableQuery(invoices, columns, { ...emptyDataTableQuery(), search: "plan", sort: { column: "amount", direction: "descending" }, page: 2 }, { pageSize: 2 });
    expect(result.total).toBe(3);
    expect(ids(result.filtered)).toEqual(["c", "a", "b"]);
    expect(ids(result.rows)).toEqual(["b"]);
    const filtered = applyDataTableQuery(invoices, columns, { ...emptyDataTableQuery(), filters: { status: ["paid"] } }, { pageSize: 10, filters });
    expect(ids(filtered.rows)).toEqual(["a", "c"]);
  });

  it("completes a partial query", () => {
    expect(completeQuery({ search: "x" })).toEqual({ search: "x", filters: {}, sort: null, page: 1 });
    expect(completeQuery()).toEqual(emptyDataTableQuery());
  });
});

describe("CSV", () => {
  it("writes a header and the column values, quoting where needed", () => {
    const csv = rowsToCsv(invoices, columns).split("\r\n");
    expect(csv[0]).toBe("Name,Status,Amount,Due,Note");
    expect(csv[1]).toBe("Plan 10,Paid,5,2026-03-01T00:00:00.000Z,first");
    expect(csv[4]).toBe('"Other, Inc",Late,,2026-02-01T00:00:00.000Z,');
  });

  it("neutralises cells that a spreadsheet would run as formulas", () => {
    const csv = rowsToCsv(
      [
        { id: "1", name: "=HYPERLINK(1)", status: "+1", amount: -5, due: new Date(0), note: "@x" },
        { id: "2", name: "-2", status: "\tTab", amount: 0, due: new Date(0), note: 'say "hi"' },
      ],
      columns,
    ).split("\r\n");
    expect(csv[1]).toBe("'=HYPERLINK(1),'+1,-5,1970-01-01T00:00:00.000Z,'@x");
    expect(csv[2].startsWith("'-2,\"'\tTab\"")).toBe(false); // a tab makes the cell text, quoting is not needed
    expect(csv[2]).toBe("'-2,'\tTab,0,1970-01-01T00:00:00.000Z,\"say \"\"hi\"\"\"");
  });

  it("uses what the column holds, not what it draws", () => {
    const cols: DataTableColumn<Invoice>[] = [{ id: "amount", header: "Total", value: (r) => (r.amount ?? 0) / 100, cell: () => "ignored" }];
    expect(rowsToCsv([invoices[2]], cols)).toBe("Total\r\n1");
  });
});

describe("the address", () => {
  const options = { filters: ["status", "page"], sortColumns: ["name", "amount"] };
  const schema = dataTableQuerySchema(options);

  it("describes the query as parameters for the address helpers", () => {
    const query = { search: "acme", filters: { status: ["Paid", "Open"] }, sort: { column: "amount", direction: "descending" as const }, page: 3 };
    const text = serializeQueryState(dataTableQueryToState(query, options), schema);
    expect(text).toBe("q=acme&page=3&sort=amount%3Adesc&status=Paid&status=Open");
    expect(dataTableQueryFromState(parseQueryState(text, schema), options)).toEqual(query);
  });

  it("gives the empty query for an empty address, and ignores what is not allowed", () => {
    expect(dataTableQueryFromState(parseQueryState("", schema), options)).toEqual(emptyDataTableQuery());
    const hostile = dataTableQueryFromState(parseQueryState("page=-4&sort=password:asc&q=x", schema), options);
    expect(hostile).toEqual({ search: "x", filters: {}, sort: null, page: 1 });
  });

  it("does not let a filter named like a reserved parameter collide", () => {
    const text = serializeQueryState(dataTableQueryToState({ search: "", filters: { page: ["x"] }, sort: null, page: 2 }, options), schema);
    expect(text).toBe("page=2&filter-page=x");
  });
});
