import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { InvoicesTable, type Invoice, type InvoicesTableProps } from "../src";
import { axeViolations } from "./axe";

const AS_OF = "2026-03-15";
const make = (patch: Partial<Invoice> & Pick<Invoice, "id" | "number">): Invoice => ({
  customer: "Northgate Foods",
  customerEmail: "accounts@northgate.example",
  issuedAt: "2026-02-01",
  dueAt: "2026-04-01",
  amount: 100,
  status: "open",
  ...patch,
});

const late = make({ id: "1", number: "INV-1", dueAt: "2026-03-01", amount: 1000, customer: "Harbor Mills" }); // open, 14 days late
const open = make({ id: "2", number: "INV-2", amount: 500 });
const paid = make({ id: "3", number: "INV-3", status: "paid", paidAt: "2026-03-10", amount: 250.25, customer: "Brightwater Supplies" });
const oldPaid = make({ id: "4", number: "INV-4", status: "paid", paidAt: "2026-01-02", amount: 999 });
const draft = make({ id: "5", number: "INV-5", status: "draft", amount: 40 });
const voided = make({ id: "6", number: "INV-6", status: "void", amount: 5 });
const euro = make({ id: "7", number: "INV-7", amount: 70, currency: "EUR" });
const all = [late, open, paid, oldPaid, draft, voided, euro];

function Table(props: Partial<InvoicesTableProps>) {
  return <InvoicesTable invoices={all} asOf={AS_OF} {...props} />;
}

const grid = () => screen.getByRole("grid", { name: "Invoices" });
const rowOf = (number: string) => within(grid()).getByText(number).closest("tr")!;
const menuFor = async (number: string) => {
  await userEvent.click(screen.getByRole("button", { name: `More actions for ${number}` }));
  return screen.findByRole("menu");
};

describe("InvoicesTable", () => {
  describe("the rows", () => {
    it("is a region and a grid named by the label, with a column per fact", () => {
      render(<Table />);
      expect(screen.getByRole("region", { name: "Invoices" })).toBeInTheDocument();
      expect(within(grid()).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(expect.arrayContaining(["Invoice", "Customer", "Issued", "Due", "Amount", "Status"]));
    });

    it("says the status in words and works overdue out from the due date", () => {
      render(<Table />);
      expect(within(rowOf("INV-1")).getByText("Overdue")).toBeInTheDocument();
      expect(within(rowOf("INV-1")).getByText("14 days overdue")).toBeInTheDocument();
      expect(within(rowOf("INV-2")).getByText("Open")).toBeInTheDocument();
      expect(within(rowOf("INV-3")).getByText("Paid")).toBeInTheDocument();
      expect(within(rowOf("INV-5")).getByText("Draft")).toBeInTheDocument();
      expect(within(rowOf("INV-6")).getByText("Void")).toBeInTheDocument();
      expect(within(rowOf("INV-2")).queryByText(/overdue/)).toBeNull();
    });

    it("says one day, not 1 days", () => {
      render(<Table invoices={[make({ id: "x", number: "INV-9", dueAt: "2026-03-14" })]} />);
      expect(screen.getByText("1 day overdue")).toBeInTheDocument();
    });

    it("formats amounts and dates for the currency and the locale", () => {
      render(<Table locale="de-DE" currency="EUR" invoices={[make({ id: "x", number: "INV-9", amount: 1240.5, currency: "EUR", dueAt: "2026-04-01" })]} summary="none" />);
      const row = rowOf("INV-9");
      expect(row.textContent).toMatch(/1\.240,50\s€/);
      expect(row.textContent).toContain("01.04.2026");
    });

    it("shows the customer's email under the name when there is one", () => {
      render(<Table />);
      expect(within(rowOf("INV-1")).getByText("accounts@northgate.example")).toBeInTheDocument();
    });

    it("filters by the status the person sees, so an open invoice past its due day is found under Overdue", async () => {
      render(<Table />);
      await userEvent.click(screen.getByRole("button", { name: /Status/ }));
      await userEvent.click(await screen.findByRole("option", { name: "Overdue" }));
      await waitFor(() => expect(within(grid()).queryByText("INV-2")).toBeNull());
      expect(within(grid()).getByText("INV-1")).toBeInTheDocument();
    });

    it("searches by invoice number and by customer", async () => {
      render(<Table />);
      await userEvent.type(screen.getByRole("searchbox", { name: /Search invoices/ }), "Brightwater");
      await waitFor(() => expect(within(grid()).queryByText("INV-1")).toBeNull());
      expect(within(grid()).getByText("INV-3")).toBeInTheDocument();
    });

    it("sorts the amount as a number, not as text", async () => {
      render(<Table summary="none" />);
      await userEvent.click(screen.getByRole("columnheader", { name: /Amount/ }));
      expect(screen.getByRole("columnheader", { name: /Amount/ })).toHaveAttribute("aria-sort", "ascending");
      const first = within(grid()).getAllByRole("row")[1];
      expect(first.textContent).toContain("INV-6"); // $5.00 is the smallest
    });

    it("makes the number a button only when onOpenInvoice is given, and not when open is not allowed", async () => {
      const onOpenInvoice = vi.fn();
      const { rerender } = render(<Table />);
      expect(screen.queryByRole("button", { name: "INV-1" })).toBeNull();
      rerender(<Table onOpenInvoice={onOpenInvoice} />);
      await userEvent.click(screen.getByRole("button", { name: "INV-1" }));
      expect(onOpenInvoice).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }));
      rerender(<Table onOpenInvoice={onOpenInvoice} permissions={{ open: "disabled" }} />);
      expect(screen.queryByRole("button", { name: "INV-1" })).toBeNull();
    });
  });

  describe("the totals", () => {
    it("adds up what is outstanding, overdue and paid in the last 30 days, in the table's currency only", () => {
      render(<Table />);
      const stats = screen.getByText("Outstanding").closest("div")!.parentElement!.parentElement!;
      expect(stats).toHaveTextContent("$1,500.00");
      expect(stats).toHaveTextContent("$1,000.00");
      expect(stats).toHaveTextContent("1 invoice past due");
      expect(stats).toHaveTextContent("$250.25"); // the payment from January is not in the last 30 days
      expect(screen.getByText(/Totals in USD\./)).toHaveTextContent("Totals in USD. 1 invoice in other currencies is not included.");
    });

    it("says nothing is late when nothing is", () => {
      render(<Table invoices={[open, paid]} />);
      expect(screen.getByText("Nothing is late")).toBeInTheDocument();
      expect(screen.getByText("Totals in USD.")).toBeInTheDocument();
    });

    it("can be hidden, or given your own numbers", () => {
      const { rerender } = render(<Table summary="none" />);
      expect(screen.queryByText("Outstanding")).toBeNull();
      rerender(<Table summary={{ outstanding: 12, overdue: 3, overdueCount: 2, paidLast30Days: 9, currency: "USD", skipped: 0 }} />);
      expect(screen.getByText("$12.00")).toBeInTheDocument();
      expect(screen.getByText("2 invoices past due")).toBeInTheDocument();
    });

    it("does not add up one page when the rows live on a server", () => {
      render(<Table serverSide totalCount={400} />);
      expect(screen.queryByText("Outstanding")).toBeNull();
    });
  });

  describe("the row actions", () => {
    const handlers = { onDownload: vi.fn(), onSendReminder: vi.fn(), onMarkPaid: vi.fn(), onVoid: vi.fn() };

    it("offers each action only where it makes sense", async () => {
      render(<Table {...handlers} />);
      const names = (menu: HTMLElement) => within(menu).getAllByRole("menuitem").map((i) => i.textContent);
      expect(names(await menuFor("INV-1"))).toEqual(["Download PDF", "Send reminder", "Record payment", "Void invoice"]);
      await userEvent.keyboard("{Escape}");
      expect(names(await menuFor("INV-3"))).toEqual(["Download PDF"]); // paid: nothing to chase, nothing to void
      await userEvent.keyboard("{Escape}");
      expect(names(await menuFor("INV-5"))).toEqual(["Download PDF", "Void invoice"]); // a draft was never sent
      await userEvent.keyboard("{Escape}");
      expect(names(await menuFor("INV-6"))).toEqual(["Download PDF"]); // void: final
    });

    it("leaves out an action whose callback you did not give", async () => {
      render(<Table onDownload={handlers.onDownload} />);
      expect(within(await menuFor("INV-1")).getAllByRole("menuitem")).toHaveLength(1);
    });

    it("has no More button and no Actions column at all when no action is possible", () => {
      render(<Table />);
      expect(screen.queryByRole("button", { name: /More actions/ })).toBeNull();
      expect(within(grid()).queryByRole("columnheader", { name: "Actions" })).toBeNull();
    });

    it("downloads without asking", async () => {
      const onDownload = vi.fn();
      render(<Table onDownload={onDownload} />);
      await userEvent.click(within(await menuFor("INV-2")).getByRole("menuitem", { name: "Download PDF" }));
      expect(onDownload).toHaveBeenCalledWith([expect.objectContaining({ id: "2" })]);
    });

    it("asks before recording a payment, names the invoice and the amount, and does nothing on cancel", async () => {
      const onMarkPaid = vi.fn();
      render(<Table onMarkPaid={onMarkPaid} />);
      await userEvent.click(within(await menuFor("INV-1")).getByRole("menuitem", { name: "Record payment" }));
      const dialog = await screen.findByRole("alertdialog");
      expect(within(dialog).getByText("Record payment for INV-1?")).toBeInTheDocument();
      expect(within(dialog).getByText("$1,000.00 from Harbor Mills is marked as paid.")).toBeInTheDocument();
      await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
      expect(onMarkPaid).not.toHaveBeenCalled();
      await userEvent.click(within(await menuFor("INV-1")).getByRole("menuitem", { name: "Record payment" }));
      await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Record payment" }));
      await waitFor(() => expect(onMarkPaid).toHaveBeenCalledWith(expect.objectContaining({ id: "1" })));
    });

    it("asks before voiding and before sending a reminder", async () => {
      const onVoid = vi.fn();
      const onSendReminder = vi.fn();
      render(<Table onVoid={onVoid} onSendReminder={onSendReminder} />);
      await userEvent.click(within(await menuFor("INV-2")).getByRole("menuitem", { name: "Void invoice" }));
      expect(within(await screen.findByRole("alertdialog")).getByText("Void INV-2?")).toBeInTheDocument();
      await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Void invoice" }));
      await waitFor(() => expect(onVoid).toHaveBeenCalledTimes(1));
      await userEvent.click(within(await menuFor("INV-1")).getByRole("menuitem", { name: "Send reminder" }));
      expect(within(await screen.findByRole("alertdialog")).getByText("Harbor Mills gets an email about $1,000.00.")).toBeInTheDocument();
      await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Send reminder" }));
      await waitFor(() => expect(onSendReminder).toHaveBeenCalledWith([expect.objectContaining({ id: "1" })]));
    });
  });

  describe("permissions", () => {
    it("hides an action when hidden and shows it disabled, with the reason, when disabled", async () => {
      const onMarkPaid = vi.fn();
      render(<Table onMarkPaid={onMarkPaid} onVoid={() => {}} permissions={{ markPaid: { state: "disabled", reason: "Only accounts can record payments" }, void: "hidden" }} />);
      const menu = await menuFor("INV-1");
      expect(within(menu).queryByRole("menuitem", { name: /Void/ })).toBeNull();
      const item = within(menu).getByRole("menuitem", { name: /Record payment/ });
      expect(item).toHaveAttribute("aria-disabled", "true");
      expect(within(menu).getByText("Only accounts can record payments")).toBeInTheDocument();
      await userEvent.click(item);
      expect(onMarkPaid).not.toHaveBeenCalled();
    });

    it("removes the checkboxes when select is hidden, and disables Export with the reason", () => {
      render(<Table onSendReminder={() => {}} permissions={{ select: "hidden", export: { state: "disabled", reason: "Only accounts can export" } }} />);
      expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
      expect(screen.getByRole("button", { name: /Export CSV/ })).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("the bulk bar", () => {
    it("turns selection on by itself when there is something to do with the selected rows", () => {
      const { rerender } = render(<Table />);
      expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
      rerender(<Table onSendReminder={() => {}} />);
      expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
    });

    it("sends reminders only for the unpaid invoices among the selected ones", async () => {
      const onSendReminder = vi.fn();
      render(<Table onSendReminder={onSendReminder} summary="none" />);
      await userEvent.click(screen.getAllByRole("checkbox")[0]); // select the whole page
      await userEvent.click(screen.getByRole("button", { name: "Send reminders" }));
      await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Send reminders" }));
      await waitFor(() => expect(onSendReminder).toHaveBeenCalledTimes(1));
      expect(onSendReminder.mock.calls[0][0].map((i: Invoice) => i.id)).toEqual(["1", "2", "7"]); // not the paid, draft or void ones
    });

    it("downloads the selected invoices", async () => {
      const onDownload = vi.fn();
      render(<Table onDownload={onDownload} summary="none" />);
      const boxes = screen.getAllByRole("checkbox");
      await userEvent.click(boxes[1]);
      await userEvent.click(boxes[2]);
      await userEvent.click(screen.getByRole("button", { name: "Download PDFs" }));
      expect(onDownload).toHaveBeenCalledTimes(1);
      expect(onDownload.mock.calls[0][0]).toHaveLength(2);
    });
  });

  describe("states and customising", () => {
    it("shows loading rows and totals while loading", () => {
      render(<Table isLoading />);
      expect(screen.getByText("Loading Outstanding")).toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Invoices" })).toHaveAttribute("aria-busy", "true");
    });

    it("says there are no invoices, in words about invoices", () => {
      render(<Table invoices={[]} summary="none" />);
      expect(screen.getByText("No invoices yet")).toBeInTheDocument();
      expect(screen.getByText("Invoices show up here once they are sent.")).toBeInTheDocument();
    });

    it("shows an error with a way to retry", async () => {
      const onRetry = vi.fn();
      render(<Table invoices={[]} summary="none" error="The server did not answer." onRetry={onRetry} />);
      expect(screen.getByText("The server did not answer.")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(onRetry).toHaveBeenCalled();
    });

    it("lets you change a status color and add class names to the parts", () => {
      const { container } = render(<Table statusTones={{ paid: "info" }} className="mine" classNames={{ summary: "totals", root: "outer" }} />);
      expect(container.firstElementChild).toHaveClass("mine", "outer");
      expect(container.querySelector(".totals")).not.toBeNull();
    });

    it("asks the server for the rest when the rows live on a server", async () => {
      const onQueryChange = vi.fn();
      render(<Table invoices={all.slice(0, 4)} serverSide totalCount={90} pageSize={4} onQueryChange={onQueryChange} />);
      expect(screen.getByText("Showing 1 to 4 of 90")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Page 2" }));
      expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    });
  });

  describe("accessibility", () => {
    it("has no axe violations with actions, selection and totals", async () => {
      const { container } = render(<Table onDownload={() => {}} onSendReminder={() => {}} onMarkPaid={() => {}} onVoid={() => {}} onOpenInvoice={() => {}} />);
      expect(await axeViolations(container)).toEqual([]);
    });

    it("has no axe violations loading, empty or failed", async () => {
      const loading = render(<Table isLoading />);
      expect(await axeViolations(loading.container)).toEqual([]);
      loading.unmount();
      const empty = render(<Table invoices={[]} />);
      expect(await axeViolations(empty.container)).toEqual([]);
      empty.unmount();
      const failed = render(<Table invoices={[]} error="No answer" onRetry={() => {}} />);
      expect(await axeViolations(failed.container)).toEqual([]);
    });

    it("renders on the server without touching the browser, with the same amounts the client shows", () => {
      const html = renderToString(<Table />).replace(/<!-- -->/g, "");
      expect(html).toContain("INV-1");
      expect(html).toContain("$1,500.00");
      expect(html).toContain("14 days overdue");
    });
  });
});
