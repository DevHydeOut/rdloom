import type { ColumnDef } from "@tanstack/react-table";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataGrid, type DataGridProps } from "../src";
import { axeViolations } from "./axe";

// Grouping with totals, tree data and master-detail (grid step 1).

interface Order {
  id: string;
  region: string;
  rep: string;
  amount: number;
}

const orders: Order[] = [
  { id: "o1", region: "North", rep: "Asha", amount: 100 },
  { id: "o2", region: "South", rep: "Ben", amount: 50 },
  { id: "o3", region: "North", rep: "Chen", amount: 250 },
  { id: "o4", region: "South", rep: "Dara", amount: 25 },
  { id: "o5", region: "North", rep: "Eli", amount: 10 },
];

const orderColumns: ColumnDef<Order, any>[] = [
  { accessorKey: "region", header: "Region" },
  { accessorKey: "rep", header: "Rep" },
  { accessorKey: "amount", header: "Amount", aggregationFn: "sum", meta: { align: "end", format: (v: number) => `$${v}` } },
];

function Orders(props: Partial<DataGridProps<Order>>) {
  return <DataGrid label="Orders" data={orders} columns={orderColumns} getRowId={(o) => o.id} groupBy={["region"]} virtualized={false} {...props} />;
}

const treegrid = (name: string) => screen.getByRole("treegrid", { name });
const bodyRows = (name: string) => within(treegrid(name)).getAllByRole("row").slice(1);
const texts = (row: HTMLElement) => within(row).getAllByRole("gridcell").map((c) => c.textContent);

describe("DataGrid grouping", () => {
  it("shows one row per group with a count and totals only where asked", () => {
    render(<Orders />);
    const rows = bodyRows("Orders");
    expect(rows).toHaveLength(2);
    expect(texts(rows[0])).toEqual(["North (3)", "", "$360"]); // Rep has no aggregationFn: empty, not "Asha"
    expect(texts(rows[1])).toEqual(["South (2)", "", "$75"]);
    expect(rows[0]).toHaveAttribute("aria-level", "1");
    expect(rows[0]).toHaveAttribute("aria-expanded", "false");
  });

  it("expands a group with the toggle, Enter, or Right/Left arrows", async () => {
    const user = userEvent.setup();
    render(<Orders />);
    await user.click(within(bodyRows("Orders")[0]).getByRole("button", { name: "Expand" }));
    let rows = bodyRows("Orders");
    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveAttribute("aria-expanded", "true");
    expect(rows[1]).toHaveAttribute("aria-level", "2");
    expect(texts(rows[1])).toEqual(["", "Asha", "$100"]);

    // Keyboard: focus the group cell, Left collapses, Right expands, Enter toggles.
    act(() => within(rows[0]).getAllByRole("gridcell")[0].focus());
    await user.keyboard("{ArrowLeft}");
    expect(bodyRows("Orders")).toHaveLength(2);
    await user.keyboard("{ArrowRight}");
    expect(bodyRows("Orders")).toHaveLength(5);
    await user.keyboard("{Enter}");
    rows = bodyRows("Orders");
    expect(rows).toHaveLength(2);
    // Right on a collapsed group opens it rather than moving.
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(within(bodyRows("Orders")[0]).getAllByRole("gridcell")[0]);
  });

  it("selects a whole group, and reports only data rows", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Orders selectionMode="multiple" onSelectionChange={onSelectionChange} />);
    await user.click(within(bodyRows("Orders")[0]).getByRole("checkbox", { name: "Select group" }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["o1", "o3", "o5"]);
    expect(bodyRows("Orders")[0]).toHaveAttribute("aria-selected", "true");
  });

  it("reports filtered data rows without group rows", () => {
    const onFilteredDataChange = vi.fn();
    render(<Orders globalFilter="south" onFilteredDataChange={onFilteredDataChange} />);
    expect(onFilteredDataChange).toHaveBeenLastCalledWith([orders[1], orders[3]]);
    expect(bodyRows("Orders")).toHaveLength(1);
  });

  it("has no axe violations, expanded", async () => {
    const { container } = render(<Orders defaultExpanded selectionMode="multiple" />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

interface Node {
  id: string;
  name: string;
  children?: Node[];
}

const tree: Node[] = [
  { id: "a", name: "src", children: [{ id: "a1", name: "button.tsx" }, { id: "a2", name: "grid.tsx" }] },
  { id: "b", name: "readme.md" },
];

function Files(props: Partial<DataGridProps<Node>>) {
  return (
    <DataGrid
      label="Files"
      data={tree}
      columns={[{ accessorKey: "name", header: "Name" }]}
      getRowId={(n) => n.id}
      getSubRows={(n) => n.children}
      virtualized={false}
      {...props}
    />
  );
}

describe("DataGrid tree data", () => {
  it("shows parents with a toggle and children one level down", async () => {
    const user = userEvent.setup();
    render(<Files />);
    expect(bodyRows("Files").map((r) => r.textContent)).toEqual(["src", "readme.md"]);
    expect(within(bodyRows("Files")[1]).queryByRole("button")).toBeNull();
    await user.click(within(bodyRows("Files")[0]).getByRole("button", { name: "Expand" }));
    const rows = bodyRows("Files");
    expect(rows.map((r) => r.textContent)).toEqual(["src", "button.tsx", "grid.tsx", "readme.md"]);
    expect(rows[1]).toHaveAttribute("aria-level", "2");
  });

  it("keeps a parent when a child matches the search", () => {
    render(<Files globalFilter="grid" defaultExpanded />);
    expect(bodyRows("Files").map((r) => r.textContent)).toEqual(["src", "grid.tsx"]);
  });

  it("sorts children inside their parent", async () => {
    const user = userEvent.setup();
    render(<Files defaultExpanded />);
    await user.click(screen.getByRole("columnheader", { name: "Name" }));
    await user.click(screen.getByRole("columnheader", { name: "Name" })); // descending
    expect(bodyRows("Files").map((r) => r.textContent)).toEqual(["src", "grid.tsx", "button.tsx", "readme.md"]);
  });
});

describe("DataGrid master-detail", () => {
  const detail = (o: Order) => <p>Details for {o.rep}</p>;

  it("opens a detail panel under the row", async () => {
    const user = userEvent.setup();
    render(<Orders groupBy={[]} renderDetail={detail} />);
    expect(screen.queryByText("Details for Asha")).toBeNull();
    const first = within(bodyRows("Orders")[0]).getAllByRole("gridcell")[0];
    act(() => first.focus());
    await user.keyboard("{ArrowRight}");
    const rows = bodyRows("Orders");
    expect(rows[0]).toHaveAttribute("aria-expanded", "true");
    const panel = within(rows[1]).getByRole("gridcell");
    expect(panel).toHaveTextContent("Details for Asha");
    expect(panel).toHaveAttribute("aria-colspan", "3");

    // Down moves onto the panel, and on to the next row.
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(panel);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toHaveTextContent("South");
  });

  it("works with groups: group rows expand rows, rows expand details", async () => {
    const user = userEvent.setup();
    render(<Orders renderDetail={detail} defaultExpanded />);
    expect(screen.getAllByText(/Details for/)).toHaveLength(5);
    await user.click(within(bodyRows("Orders")[0]).getByRole("button", { name: "Collapse" }));
    expect(screen.getAllByText(/Details for/)).toHaveLength(2); // South's two stay open
  });

  it("has no axe violations with a panel open", async () => {
    const { container } = render(<Orders groupBy={[]} renderDetail={detail} defaultExpanded />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
