import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataTable, type DataTableProps } from "../src/data-table/data-table";
import type { DataTableBulkAction, DataTableColumn, DataTableQuery, DataTableRowAction } from "../src/data-table/query";
import { axeViolations } from "./axe";

interface Order {
  id: string;
  number: string;
  customer: string;
  status: string;
  total: number;
}

const statuses = ["Paid", "Pending", "Overdue", "Refunded"];
const orders: Order[] = Array.from({ length: 24 }, (_, i) => ({
  id: `o${i + 1}`,
  number: `Order ${String(i + 1).padStart(2, "0")}`,
  customer: `Customer ${(i % 5) + 1}`,
  status: statuses[i % 4],
  total: (i + 1) * 10,
}));
const columns: DataTableColumn<Order>[] = [
  { id: "number", header: "Order", sortable: true },
  { id: "customer", header: "Customer", sortable: true },
  { id: "status", header: "Status" },
  { id: "total", header: "Total", align: "end", sortable: true, cell: (o) => `$${o.total}` },
];
const filters = [{ id: "status", label: "Status", options: statuses }];

const table = () => screen.getByRole("grid", { name: "Orders" });
const rowsOf = () => within(table()).getAllByRole("row").slice(1);
const firstCells = () => rowsOf().map((r) => within(r).getByRole("rowheader").textContent ?? "");

// Like arriving with Tab: the row takes focus, then the arrow keys move to the button inside it.
async function reach(name: string) {
  const target = screen.getByRole("button", { name });
  target.closest("tr")!.focus();
  for (let i = 0; i < 8 && document.activeElement !== target; i++) await userEvent.keyboard("{ArrowRight}");
  expect(target).toHaveFocus();
}

function Table(props: Partial<DataTableProps<Order>>) {
  return <DataTable label="Orders" rows={orders} columns={columns} getRowId={(o) => o.id} {...props} />;
}

describe("DataTable", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("the basics", () => {
    it("is a labelled region with a named table, a count and pages", () => {
      render(<Table pageSize={8} />);
      expect(screen.getByRole("region", { name: "Orders" })).toBeInTheDocument();
      expect(table()).toBeInTheDocument();
      expect(rowsOf()).toHaveLength(8);
      expect(within(table()).getAllByRole("columnheader").map((h) => h.textContent?.trim())).toEqual(["Order", "Customer", "Status", "Total"]);
      expect(screen.getByText("24 results")).toBeInTheDocument();
      expect(screen.getByText("Showing 1 to 8 of 24")).toBeInTheDocument();
      expect(within(table()).getByRole("gridcell", { name: "$10" })).toHaveClass("!text-end");
    });

    it("has no search, filters, export-less toolbar items it was not asked for", () => {
      render(<Table pageSize={8} />);
      expect(screen.queryByRole("searchbox")).toBeNull();
      expect(screen.queryByRole("button", { name: /Status/ })).toBeNull();
      expect(screen.queryByRole("checkbox")).toBeNull();
    });

    it("pages, and goes back to page one when the search changes", async () => {
      render(<Table pageSize={8} searchable />);
      await userEvent.click(screen.getByRole("button", { name: "Page 2" }));
      expect(screen.getByText("Showing 9 to 16 of 24")).toBeInTheDocument();
      expect(firstCells()[0]).toContain("Order 09");
      await userEvent.type(screen.getByRole("searchbox", { name: "Search orders" }), "order");
      expect(screen.getByText("Showing 1 to 8 of 24")).toBeInTheDocument();
    });

    it("sorts from a column header and exposes aria-sort", async () => {
      render(<Table pageSize={50} />);
      const total = () => screen.getByRole("columnheader", { name: /Total/ });
      await userEvent.click(total());
      expect(total()).toHaveAttribute("aria-sort", "ascending");
      await userEvent.click(total());
      expect(total()).toHaveAttribute("aria-sort", "descending");
      expect(firstCells()[0]).toContain("Order 24");
      expect(screen.getByRole("columnheader", { name: /Status/ })).not.toHaveAttribute("aria-sort");
    });

    it("sorts from the keyboard", async () => {
      render(<Table pageSize={50} />);
      const header = screen.getByRole("columnheader", { name: /Customer/ });
      await userEvent.tab(); // into the table
      header.focus();
      await userEvent.keyboard("{Enter}");
      expect(header).toHaveAttribute("aria-sort", "ascending");
      await userEvent.keyboard("{Enter}");
      expect(header).toHaveAttribute("aria-sort", "descending");
    });
  });

  describe("search and filters", () => {
    it("filters as you type, announces the new count, and says when nothing matches", async () => {
      render(<Table pageSize={8} searchable />);
      await userEvent.type(screen.getByRole("searchbox", { name: "Search orders" }), "order 03");
      expect(screen.getByText("1 result")).toBeInTheDocument();
      expect(screen.getByText("1 result")).toHaveAttribute("role", "status");
      expect(firstCells()[0]).toContain("Order 03");
      await userEvent.clear(screen.getByRole("searchbox"));
      await userEvent.type(screen.getByRole("searchbox"), "zzzz");
      expect(screen.getByText("No results")).toBeInTheDocument();
      expect(screen.queryByRole("grid")).toBeNull();
      const group = screen.getByText("No results").closest("div")!.parentElement!;
      await userEvent.click(within(group).getByRole("button", { name: "Clear filters" }));
      expect(screen.getByRole("searchbox")).toHaveValue("");
      expect(screen.getByText("24 results")).toBeInTheDocument();
    });

    it("searches only the columns it is told to", async () => {
      render(<Table pageSize={50} searchable={["number"]} />);
      await userEvent.type(screen.getByRole("searchbox"), "Customer 2");
      expect(screen.getByText("No results")).toBeInTheDocument();
    });

    it("filters from a select, calls onFilter, and clears", async () => {
      const onFilter = vi.fn();
      render(<Table pageSize={50} filters={filters} onFilter={onFilter} />);
      await userEvent.click(screen.getByRole("button", { name: /Status/ }));
      await userEvent.click(await screen.findByRole("option", { name: "Overdue" }));
      expect(screen.getByText("6 results")).toBeInTheDocument();
      expect(onFilter).toHaveBeenLastCalledWith({ status: ["Overdue"] });
      await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
      expect(screen.getByText("24 results")).toBeInTheDocument();
      expect(onFilter).toHaveBeenLastCalledWith({});
    });

    it("tells onSearch the text", async () => {
      const onSearch = vi.fn();
      render(<Table searchable onSearch={onSearch} />);
      await userEvent.type(screen.getByRole("searchbox"), "ab");
      expect(onSearch).toHaveBeenLastCalledWith("ab");
    });

    it("starts from a default query", () => {
      render(<Table pageSize={50} searchable defaultQuery={{ search: "customer 2", sort: { column: "number", direction: "descending" } }} />);
      expect(screen.getByRole("searchbox")).toHaveValue("customer 2");
      expect(firstCells()[0]).toContain("Order 22"); // 2, 7, 12, 17, 22: the largest first
      expect(screen.getByText("5 results")).toBeInTheDocument();
    });
  });

  describe("the query kept by the app", () => {
    it("shows the query it is given, reports changes, and follows the app when it changes", async () => {
      const onQueryChange = vi.fn();
      const query: DataTableQuery = { search: "", filters: {}, sort: null, page: 2 };
      const { rerender } = render(<Table pageSize={8} searchable query={query} onQueryChange={onQueryChange} />);
      expect(screen.getByText("Showing 9 to 16 of 24")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Page 3" }));
      expect(onQueryChange).toHaveBeenLastCalledWith({ search: "", filters: {}, sort: null, page: 3 });
      // the app did not apply it: the table still shows page 2
      expect(screen.getByText("Showing 9 to 16 of 24")).toBeInTheDocument();
      rerender(<Table pageSize={8} searchable query={{ ...query, search: "order 05", page: 1 }} onQueryChange={onQueryChange} />);
      expect(screen.getByRole("searchbox")).toHaveValue("order 05"); // e.g. the back button
      expect(screen.getByText("1 result")).toBeInTheDocument();
    });
  });

  describe("selection and bulk actions", () => {
    it("shows checkboxes, announces how many are selected and shows the bulk bar without taking focus", async () => {
      const onSelectionChange = vi.fn();
      const bulkActions: DataTableBulkAction<Order>[] = [{ id: "archive", label: "Archive", onAction: () => {} }];
      render(<Table pageSize={8} selectionMode="multiple" bulkActions={bulkActions} onSelectionChange={onSelectionChange} />);
      expect(screen.queryByRole("group", { name: "Bulk actions" })).toBeNull();
      const boxes = screen.getAllByRole("checkbox");
      await userEvent.click(boxes[1]);
      await userEvent.click(boxes[2]);
      await userEvent.click(boxes[3]);
      expect(screen.getAllByText("3 selected").some((el) => el.getAttribute("role") === "status")).toBe(true);
      expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["o1", "o2", "o3"]));
      const bar = screen.getByRole("group", { name: "Bulk actions" });
      expect(within(bar).getByRole("button", { name: "Archive" })).toBeInTheDocument();
      expect(bar.contains(document.activeElement)).toBe(false);
      await userEvent.click(within(bar).getByRole("button", { name: "Clear selection" }));
      expect(screen.queryByRole("group", { name: "Bulk actions" })).toBeNull();
    });

    it("selects the rows on the page from the header box", async () => {
      render(<Table pageSize={5} selectionMode="multiple" bulkActions={[{ id: "a", label: "Archive", onAction: () => {} }]} />);
      await userEvent.click(screen.getAllByRole("checkbox")[0]);
      expect(screen.getAllByText("5 selected").length).toBeGreaterThan(0);
      await userEvent.click(screen.getAllByRole("checkbox")[0]);
      expect(screen.queryByRole("group", { name: "Bulk actions" })).toBeNull();
    });

    it("keeps the selection across pages", async () => {
      render(<Table pageSize={5} selectionMode="multiple" bulkActions={[{ id: "a", label: "Archive", onAction: () => {} }]} />);
      await userEvent.click(screen.getAllByRole("checkbox")[1]);
      await userEvent.click(screen.getByRole("button", { name: "Page 2" }));
      await userEvent.click(screen.getAllByRole("checkbox")[1]);
      expect(screen.getAllByText("2 selected").length).toBeGreaterThan(0);
    });

    it("selects with the keyboard", async () => {
      render(<Table pageSize={5} selectionMode="multiple" bulkActions={[{ id: "a", label: "Archive", onAction: () => {} }]} />);
      screen.getAllByRole("checkbox")[1].focus();
      await userEvent.keyboard(" ");
      expect(screen.getAllByText("1 selected").length).toBeGreaterThan(0);
    });

    it("runs a bulk action with the selected rows, then clears the selection and moves focus into the table", async () => {
      const onAction = vi.fn();
      render(<Table pageSize={8} selectionMode="multiple" bulkActions={[{ id: "archive", label: "Archive", onAction }]} />);
      const boxes = screen.getAllByRole("checkbox");
      await userEvent.click(boxes[2]);
      await userEvent.click(boxes[4]);
      await userEvent.click(screen.getByRole("button", { name: "Archive" }));
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onAction.mock.calls[0][0].map((o: Order) => o.id)).toEqual(["o2", "o4"]);
      await waitFor(() => expect(screen.queryByRole("group", { name: "Bulk actions" })).toBeNull());
      expect(screen.getByText("Archive done for 2 rows")).toBeInTheDocument();
      await waitFor(() => expect(table().contains(document.activeElement)).toBe(true));
    });

    it("asks before a danger action, says how many rows it touches, and does nothing on cancel", async () => {
      const onAction = vi.fn();
      render(
        <Table
          pageSize={8}
          selectionMode="multiple"
          bulkActions={[{ id: "delete", label: "Delete", variant: "danger", confirm: { title: "Delete orders?", confirmLabel: "Delete orders" }, onAction }]}
        />,
      );
      const boxes = screen.getAllByRole("checkbox");
      await userEvent.click(boxes[1]);
      await userEvent.click(boxes[2]);
      await userEvent.click(boxes[3]);
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));
      const dialog = await screen.findByRole("alertdialog");
      expect(within(dialog).getByText("Delete orders?")).toBeInTheDocument();
      expect(within(dialog).getByText(/3 selected rows/)).toBeInTheDocument();
      await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
      expect(onAction).not.toHaveBeenCalled();
      expect(screen.getAllByText("3 selected").length).toBeGreaterThan(0);
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));
      await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete orders" }));
      await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
      expect(onAction.mock.calls[0][0]).toHaveLength(3);
    });

    it("keeps the selection when a bulk action fails", async () => {
      const onAction = vi.fn().mockRejectedValue(new Error("no"));
      render(<Table pageSize={8} selectionMode="multiple" bulkActions={[{ id: "a", label: "Archive", onAction }]} />);
      await userEvent.click(screen.getAllByRole("checkbox")[1]);
      await userEvent.click(screen.getByRole("button", { name: "Archive" }));
      await waitFor(() => expect(screen.getByText("Archive failed")).toBeInTheDocument());
      expect(screen.getByRole("group", { name: "Bulk actions" })).toBeInTheDocument();
    });

    it("works controlled", async () => {
      const onSelectionChange = vi.fn();
      const { rerender } = render(<Table pageSize={8} selectionMode="multiple" selectedKeys={new Set(["o2"])} onSelectionChange={onSelectionChange} />);
      expect(screen.getAllByRole("checkbox")[2]).toBeChecked();
      await userEvent.click(screen.getAllByRole("checkbox")[1]);
      expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["o1", "o2"]));
      expect(screen.getAllByRole("checkbox")[1]).not.toBeChecked(); // the app has not applied it
      rerender(<Table pageSize={8} selectionMode="multiple" selectedKeys={new Set(["o1", "o2"])} onSelectionChange={onSelectionChange} />);
      expect(screen.getAllByRole("checkbox")[1]).toBeChecked();
    });
  });

  describe("row actions", () => {
    function Deletable({ initial = orders.slice(0, 5), onDelete }: { initial?: Order[]; onDelete?: (o: Order) => void }) {
      const [rows, setRows] = useState(initial);
      const rowActions = (order: Order): DataTableRowAction<Order>[] => [
        { id: "edit", label: "Edit", onAction: () => {} },
        {
          id: "delete",
          label: "Delete order",
          variant: "danger",
          confirm: { title: `Delete ${order.number}?`, confirmLabel: "Delete" },
          onAction: () => {
            onDelete?.(order);
            setRows((all) => all.filter((o) => o.id !== order.id));
          },
        },
      ];
      return <Table rows={rows} rowActions={rowActions} />;
    }

    it("has a More button per row that names the row", () => {
      render(<Deletable />);
      expect(screen.getByRole("button", { name: "More actions for Order 01" })).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /More actions for/ })).toHaveLength(5);
      expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
    });

    it("runs a plain action from the keyboard", async () => {
      const onAction = vi.fn();
      render(<Table pageSize={5} rowActions={() => [{ id: "edit", label: "Edit", onAction }]} />);
      await reach("More actions for Order 02");
      await userEvent.keyboard("{Enter}");
      const menu = await screen.findByRole("menu");
      expect(within(menu).getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
      await userEvent.keyboard("{ArrowDown}{Enter}");
      expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: "o2" }));
      await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    });

    it("deletes with a confirmation from the keyboard, then focuses the next row", async () => {
      const onDelete = vi.fn();
      render(<Deletable onDelete={onDelete} />);
      await reach("More actions for Order 02");
      await userEvent.keyboard("{Enter}");
      await screen.findByRole("menu");
      await userEvent.keyboard("{ArrowDown}{Enter}"); // Delete order
      const dialog = await screen.findByRole("alertdialog");
      expect(within(dialog).getByText("Delete Order 02?")).toBeInTheDocument();
      expect(onDelete).not.toHaveBeenCalled();
      await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
      await waitFor(() => expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "o2" })));
      await waitFor(() => expect(screen.queryByText("Order 02")).toBeNull());
      expect(screen.getByText("Delete order done for Order 02")).toBeInTheDocument();
      // focus lands on the row that took its place, not on the page top
      await waitFor(() => expect(document.activeElement).toBe(rowsOf()[1]));
      expect(within(rowsOf()[1]).getByRole("rowheader").textContent).toContain("Order 03");
    });

    it("focuses the new last row when the last row is deleted, and the block when none is left", async () => {
      render(<Deletable initial={orders.slice(0, 2)} />);
      const remove = async (name: string) => {
        await userEvent.click(screen.getByRole("button", { name }));
        await userEvent.click(await screen.findByRole("menuitem", { name: "Delete order" }));
        await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }));
      };
      await remove("More actions for Order 02");
      await waitFor(() => expect(document.activeElement).toBe(rowsOf()[0]));
      await remove("More actions for Order 01");
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("region", { name: "Orders" })));
      expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
    });

    it("does not delete when the dialog is cancelled", async () => {
      const onDelete = vi.fn();
      render(<Deletable onDelete={onDelete} />);
      await userEvent.click(screen.getByRole("button", { name: "More actions for Order 01" }));
      await userEvent.click(await screen.findByRole("menuitem", { name: "Delete order" }));
      await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }));
      expect(onDelete).not.toHaveBeenCalled();
      expect(screen.getByText("Order 01")).toBeInTheDocument();
    });

    it("tells the person when an action failed, and keeps the dialog open", async () => {
      render(<Table pageSize={5} rowActions={() => [{ id: "delete", label: "Delete order", confirm: { title: "Delete?" }, onAction: () => Promise.reject(new Error("no")) }]} />);
      await userEvent.click(screen.getByRole("button", { name: "More actions for Order 01" }));
      await userEvent.click(await screen.findByRole("menuitem", { name: "Delete order" }));
      await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Confirm" }));
      await waitFor(() => expect(screen.getByText("Delete order failed for Order 01")).toBeInTheDocument());
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("leaves the cell empty for a row with no actions", () => {
      render(<Table pageSize={5} rowActions={(o) => (o.id === "o1" ? [] : [{ id: "x", label: "X", onAction: () => {} }])} />);
      expect(screen.queryByRole("button", { name: "More actions for Order 01" })).toBeNull();
      expect(screen.getByRole("button", { name: "More actions for Order 02" })).toBeInTheDocument();
    });
  });

  describe("opening a row", () => {
    it("makes the first cell a button and calls onRowOpen and onSelect", async () => {
      const onRowOpen = vi.fn();
      const onSelect = vi.fn();
      render(<Table pageSize={3} onRowOpen={onRowOpen} onSelect={onSelect} />);
      await userEvent.click(screen.getByRole("button", { name: "Order 01" }));
      expect(onRowOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "o1" }));
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "o1" }));
    });

    it("opens from the keyboard", async () => {
      const onRowOpen = vi.fn();
      render(<Table pageSize={3} onRowOpen={onRowOpen} />);
      await reach("Order 02");
      await userEvent.keyboard("{Enter}");
      expect(onRowOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "o2" }));
    });

    it("renders a link when it is given an address", () => {
      render(<Table pageSize={3} rowHref={(o) => `/orders/${o.id}`} />);
      expect(screen.getByRole("link", { name: "Order 01" })).toHaveAttribute("href", "/orders/o1");
    });
  });

  describe("states", () => {
    it("shows loading rows, marks itself busy and disables export", () => {
      render(<Table rows={[]} isLoading searchable />);
      expect(screen.getByRole("region", { name: "Orders" })).toHaveAttribute("aria-busy", "true");
      expect(screen.getByText("Loading orders")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Export CSV" })).toBeDisabled();
      expect(rowsOf().length).toBeGreaterThan(0);
      expect(screen.queryByText("Nothing here yet")).toBeNull();
    });

    it("says there is nothing yet, and shows the empty action", () => {
      render(<Table rows={[]} emptyTitle="No orders yet" emptyDescription="They appear here." emptyAction={<button>Add order</button>} searchable />);
      expect(screen.getByText("No orders yet")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add order" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
      expect(screen.getByText("0 results")).toBeInTheDocument();
    });

    it("does not show the empty action when a search found nothing", async () => {
      render(<Table emptyAction={<button>Add order</button>} searchable />);
      await userEvent.type(screen.getByRole("searchbox"), "zzz");
      expect(screen.queryByRole("button", { name: "Add order" })).toBeNull();
      expect(screen.getAllByRole("button", { name: "Clear filters" }).length).toBeGreaterThan(0);
    });

    it("shows an error with a retry, instead of the rows", async () => {
      const onRetry = vi.fn();
      render(<Table error="The orders service did not answer." onRetry={onRetry} />);
      expect(screen.getByText("Couldn't load orders")).toBeInTheDocument();
      expect(screen.getByText("The orders service did not answer.")).toBeInTheDocument();
      expect(screen.queryByRole("grid")).toBeNull();
      expect(screen.getByText("Could not load orders")).toHaveAttribute("role", "status");
      await userEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(onRetry).toHaveBeenCalled();
    });

    it("takes a DataState, which wins over the flags", () => {
      const { rerender } = render(<Table state="loading" />);
      expect(screen.getByText("Loading orders")).toBeInTheDocument();
      rerender(<Table state="empty" rows={[]} />);
      expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
      rerender(<Table state="error" />);
      expect(screen.getByText("Couldn't load orders")).toBeInTheDocument();
      rerender(<Table state="ready" isLoading />);
      expect(screen.getByRole("grid")).toBeInTheDocument();
      expect(screen.queryByText("Loading orders")).toBeNull();
    });
  });

  describe("export", () => {
    it("hands the rows that match, every page, and the query, to onExport", async () => {
      const onExport = vi.fn();
      render(<Table pageSize={5} searchable onExport={onExport} />);
      await userEvent.type(screen.getByRole("searchbox"), "order 1");
      await userEvent.click(screen.getByRole("button", { name: "Export CSV" }));
      expect(onExport).toHaveBeenCalledTimes(1);
      expect(onExport.mock.calls[0][0]).toHaveLength(10);
      expect(onExport.mock.calls[0][1].search).toBe("order 1");
    });

    it("downloads a CSV of everything that matches, and says so", async () => {
      const create = vi.fn(() => "blob:x");
      Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() });
      const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      render(<Table pageSize={5} />);
      await userEvent.click(screen.getByRole("button", { name: "Export CSV" }));
      const blob = (create.mock.calls[0] as unknown as [Blob])[0];
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsText(blob);
      });
      expect(text).toContain("Order 24");
      expect(text).toContain("Order,Customer,Status,Total");
      expect(await screen.findByText("Exported 24 rows to orders.csv")).toBeInTheDocument();
      click.mockRestore();
    });
  });

  describe("permissions", () => {
    it("hides what is hidden", () => {
      render(<Table selectionMode="multiple" bulkActions={[{ id: "a", label: "Archive", onAction: () => {} }]} rowActions={() => [{ id: "x", label: "X", onAction: () => {} }]} permissions={{ export: "hidden", select: "hidden", rowActions: "hidden" }} />);
      expect(screen.queryByRole("button", { name: "Export CSV" })).toBeNull();
      expect(screen.queryByRole("checkbox")).toBeNull();
      expect(screen.queryByRole("button", { name: /More actions/ })).toBeNull();
    });

    it("keeps a disabled export focusable and says why", async () => {
      const onExport = vi.fn();
      render(<Table onExport={onExport} permissions={{ export: { state: "disabled", reason: "Only finance can export" } }} />);
      const button = screen.getByRole("button", { name: "Export CSV" });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAccessibleDescription("Only finance can export");
      button.focus();
      expect(button).toHaveFocus();
      await userEvent.click(button);
      expect(onExport).not.toHaveBeenCalled();
    });

    it("disables bulk actions as a group, with the reason", async () => {
      const onAction = vi.fn();
      render(<Table selectionMode="multiple" bulkActions={[{ id: "a", label: "Archive", onAction }]} permissions={{ bulk: { state: "disabled", reason: "Ask an admin" } }} />);
      await userEvent.click(screen.getAllByRole("checkbox")[1]);
      const button = screen.getByRole("button", { name: "Archive" });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAccessibleDescription("Ask an admin");
      await userEvent.click(button);
      expect(onAction).not.toHaveBeenCalled();
    });

    it("removes the bulk bar when bulk is hidden, and a hidden single action", async () => {
      render(
        <Table
          selectionMode="multiple"
          bulkActions={[
            { id: "a", label: "Archive", onAction: () => {} },
            { id: "d", label: "Delete", permission: "hidden", onAction: () => {} },
          ]}
        />,
      );
      await userEvent.click(screen.getAllByRole("checkbox")[1]);
      expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    });

    it("disables a single row action with its reason, and hides another", async () => {
      const onAction = vi.fn();
      render(
        <Table
          pageSize={5}
          rowActions={() => [
            { id: "refund", label: "Refund", permission: { state: "disabled", reason: "Only managers refund" }, onAction },
            { id: "delete", label: "Delete", permission: "hidden", onAction },
            { id: "view", label: "View", onAction },
          ]}
        />,
      );
      await userEvent.click(screen.getByRole("button", { name: "More actions for Order 01" }));
      const menu = await screen.findByRole("menu");
      expect(within(menu).queryByRole("menuitem", { name: /Delete/ })).toBeNull();
      const refund = within(menu).getByRole("menuitem", { name: /Refund/ });
      expect(refund).toHaveAttribute("aria-disabled", "true");
      expect(within(menu).getByText("Only managers refund")).toBeInTheDocument();
      await userEvent.click(refund);
      expect(onAction).not.toHaveBeenCalled();
    });

    it("shows a disabled More button with the reason when rowActions is disabled", () => {
      render(<Table pageSize={2} rowActions={() => [{ id: "x", label: "X", onAction: () => {} }]} permissions={{ rowActions: { state: "disabled", reason: "Read only" } }} />);
      const button = screen.getByRole("button", { name: "More actions for Order 01, unavailable: Read only" });
      expect(button).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("with the rows on a server", () => {
    it("shows exactly what it is given, counts from totalCount, and asks for the rest", async () => {
      const onQueryChange = vi.fn();
      render(<Table rows={orders.slice(0, 8)} totalCount={240} pageSize={8} serverSide onQueryChange={onQueryChange} />);
      expect(onQueryChange).not.toHaveBeenCalled(); // not on mount
      expect(screen.getByText("240 results")).toBeInTheDocument();
      expect(screen.getByText("Showing 1 to 8 of 240")).toBeInTheDocument();
      expect(rowsOf()).toHaveLength(8);
      await userEvent.click(screen.getByRole("button", { name: "Page 2" }));
      expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    });

    it("waits for typing to pause before asking, and asks once", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const onQueryChange = vi.fn();
      render(<Table rows={orders.slice(0, 8)} totalCount={240} pageSize={8} serverSide searchable onQueryChange={onQueryChange} />);
      for (const v of ["a", "ab", "abc"]) fireEvent.change(screen.getByRole("searchbox"), { target: { value: v } });
      expect(onQueryChange).not.toHaveBeenCalled();
      await act(async () => vi.advanceTimersByTime(300));
      expect(onQueryChange).toHaveBeenCalledTimes(1);
      expect(onQueryChange).toHaveBeenCalledWith(expect.objectContaining({ search: "abc", page: 1 }));
    });

    it("keeps a delayed search and a filter chosen meanwhile, and sorting asks too", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const onQueryChange = vi.fn();
      render(<Table rows={orders.slice(0, 8)} totalCount={240} pageSize={8} serverSide searchable filters={filters} onQueryChange={onQueryChange} />);
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ada" } });
      await userEvent.click(screen.getByRole("button", { name: /Status/ }));
      await userEvent.click(await screen.findByRole("option", { name: "Paid" }));
      await act(async () => vi.advanceTimersByTime(300));
      expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ search: "ada", filters: { status: ["Paid"] } }));
      await userEvent.click(screen.getByRole("columnheader", { name: /Total/ }));
      expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ sort: { column: "total", direction: "ascending" } }));
    });

    it("shows Export only when you handle it", () => {
      const { rerender } = render(<Table rows={orders.slice(0, 8)} totalCount={240} serverSide />);
      expect(screen.queryByRole("button", { name: "Export CSV" })).toBeNull();
      rerender(<Table rows={orders.slice(0, 8)} totalCount={240} serverSide onExport={() => {}} />);
      expect(screen.getByRole("button", { name: "Export CSV" })).toBeEnabled();
    });
  });

  describe("on a narrow space", () => {
    it("shows cards in a list instead of the table, with the first column as the title", () => {
      render(<Table pageSize={4} layout="cards" />);
      expect(screen.queryByRole("grid")).toBeNull();
      const list = screen.getByRole("list", { name: "Orders, as a list" });
      const items = within(list).getAllByRole("listitem");
      expect(items).toHaveLength(4);
      expect(within(items[0]).getByText("Order 01")).toBeInTheDocument();
      expect(within(items[0]).getByText("Customer")).toBeInTheDocument(); // label of the value
      expect(within(items[0]).getByText("Customer 1")).toBeInTheDocument();
      expect(within(items[0]).getByText("$10")).toBeInTheDocument();
    });

    it("leaves out columns marked hideOnMobile", () => {
      const cols = columns.map((c) => (c.id === "customer" ? { ...c, hideOnMobile: true } : c));
      render(<Table pageSize={2} layout="cards" columns={cols} />);
      expect(screen.queryByText("Customer 1")).toBeNull();
    });

    it("has a checkbox, a More menu and the bulk bar on cards", async () => {
      const onAction = vi.fn();
      render(<Table pageSize={4} layout="cards" selectionMode="multiple" bulkActions={[{ id: "a", label: "Archive", onAction }]} rowActions={() => [{ id: "edit", label: "Edit", onAction: () => {} }]} />);
      await userEvent.click(screen.getByRole("checkbox", { name: "Select Order 02" }));
      expect(screen.getAllByText("1 selected").length).toBeGreaterThan(0);
      await userEvent.click(screen.getByRole("checkbox", { name: "Select all on this page" }));
      expect(screen.getAllByText("4 selected").length).toBeGreaterThan(0);
      await userEvent.click(screen.getByRole("button", { name: "Archive" }));
      expect(onAction.mock.calls[0][0]).toHaveLength(4);
      await waitFor(() => expect(screen.getByRole("list", { name: "Orders, as a list" }).contains(document.activeElement)).toBe(true));
      await userEvent.click(screen.getByRole("button", { name: "More actions for Order 01" }));
      expect(await screen.findByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    });

    it("moves filters and sort into a sheet", async () => {
      render(<Table pageSize={50} layout="cards" filters={filters} />);
      expect(screen.queryByRole("button", { name: /^Status/ })).toBeNull();
      await userEvent.click(screen.getByRole("button", { name: "Filters" }));
      const sheet = await screen.findByRole("dialog", { name: "Filters" });
      await userEvent.click(within(sheet).getByRole("button", { name: /Status/ }));
      await userEvent.click(await screen.findByRole("option", { name: "Overdue" }));
      expect(within(sheet).getByRole("button", { name: "Show 6 results" })).toBeInTheDocument();
      await userEvent.click(within(sheet).getByRole("button", { name: "Show 6 results" }));
      expect(screen.getByRole("button", { name: "Filters (1)" })).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(6);
    });

    it("switches by the width of the block itself", async () => {
      let notify: (width: number) => void = () => {};
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(cb: (entries: Array<{ contentRect: { width: number } }>) => void) {
            notify = (width) => cb([{ contentRect: { width } }]);
          }
          observe() {}
          disconnect() {}
        },
      );
      render(<Table pageSize={4} />);
      expect(screen.getByRole("grid")).toBeInTheDocument();
      act(() => notify(400));
      expect(screen.queryByRole("grid")).toBeNull();
      expect(screen.getByRole("list", { name: "Orders, as a list" })).toBeInTheDocument();
      act(() => notify(900));
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });
  });

  describe("every part takes a class name", () => {
    it("applies each slot", async () => {
      render(
        <Table
          pageSize={5}
          searchable
          filters={filters}
          selectionMode="multiple"
          bulkActions={[{ id: "a", label: "Archive", onAction: () => {} }]}
          classNames={{ root: "c-root", toolbar: "c-toolbar", search: "c-search", filters: "c-filters", count: "c-count", export: "c-export", "bulk-bar": "c-bulk", table: "c-table", header: "c-header", row: "c-row", cell: "c-cell", footer: "c-footer", pagination: "c-pagination" }}
        />,
      );
      await userEvent.click(screen.getAllByRole("checkbox")[1]);
      for (const slot of ["root", "toolbar", "search", "filters", "count", "export", "bulk", "table", "header", "row", "cell", "footer", "pagination"]) {
        expect(document.querySelector(`.c-${slot}`), slot).not.toBeNull();
      }
    });

    it("applies the cards, card, empty and error slots", () => {
      const { rerender } = render(<Table pageSize={2} layout="cards" classNames={{ cards: "c-cards", card: "c-card" }} />);
      expect(document.querySelector(".c-cards")).not.toBeNull();
      expect(document.querySelectorAll(".c-card")).toHaveLength(2);
      rerender(<Table rows={[]} classNames={{ empty: "c-empty" }} />);
      expect(document.querySelector(".c-empty")).not.toBeNull();
      rerender(<Table error classNames={{ error: "c-error" }} />);
      expect(document.querySelector(".c-error")).not.toBeNull();
    });
  });

  it("renders on the server", () => {
    const html = renderToString(<Table pageSize={3} searchable />);
    expect(html).toContain("Order 01");
    expect(html).toContain("24 results");
  });

  it("has no axe violations: ready, loading, empty, error, no results, selected, cards, menu open", async () => {
    const full = { searchable: true, filters, selectionMode: "multiple" as const, bulkActions: [{ id: "a", label: "Archive", onAction: () => {} }], rowActions: () => [{ id: "x", label: "Edit", onAction: () => {} }], onRowOpen: () => {} };
    const view = render(<Table pageSize={6} {...full} />);
    expect(await axeViolations(view.container)).toEqual([]);
    await userEvent.click(screen.getAllByRole("checkbox")[1]);
    expect(await axeViolations(view.container)).toEqual([]);
    view.rerender(<Table rows={[]} isLoading {...full} />);
    expect(await axeViolations(view.container)).toEqual([]);
    view.rerender(<Table rows={[]} {...full} />);
    expect(await axeViolations(view.container)).toEqual([]);
    view.rerender(<Table error="Boom" onRetry={() => {}} {...full} />);
    expect(await axeViolations(view.container)).toEqual([]);
    view.rerender(<Table pageSize={6} {...full} />);
    await userEvent.type(screen.getByRole("searchbox"), "zzzz");
    expect(await axeViolations(view.container)).toEqual([]);
    view.rerender(<Table pageSize={6} layout="cards" {...full} />);
    await userEvent.clear(screen.getByRole("searchbox"));
    expect(await axeViolations(view.container)).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "More actions for Order 01" }));
    await screen.findByRole("menu");
    expect(await axeViolations(screen.getByRole("menu").parentElement!)).toEqual([]);
  }, 60_000);
});
