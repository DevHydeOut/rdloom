import { getLocalTimeZone, parseDate, today, type CalendarDate } from "@internationalized/date";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Button } from "./components/rdloom/button/button";
import { Combobox, ComboboxItem } from "./components/rdloom/combobox/combobox";
import { DataGrid } from "./components/rdloom/data-grid/data-grid";
import { DatePicker } from "./components/rdloom/date-picker/date-picker";
import { DateRangePicker } from "./components/rdloom/date-range-picker/date-range-picker";
import { defaultDateRangePresets } from "./components/rdloom/date-range-picker/presets";
import { Dialog, DialogTrigger } from "./components/rdloom/dialog/dialog";
import { Select, SelectItem } from "./components/rdloom/select/select";
import { TextField } from "./components/rdloom/text-field/text-field";
import { toast, ToastRegion } from "./components/rdloom/toast/toast";
import { customers, makeOrders, statuses, type Order } from "./data";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const columns: ColumnDef<Order, any>[] = [
  { accessorKey: "id", header: "Order", size: 130 },
  { accessorKey: "customer", header: "Customer", size: 190 },
  { accessorKey: "status", header: "Status", size: 120 },
  { accessorKey: "items", header: "Items", size: 90, meta: { align: "end", editable: true, editor: "number" } },
  { accessorKey: "total", header: "Total", size: 130, meta: { align: "end", format: currency.format } },
  { accessorKey: "placed", header: "Placed", size: 130 },
];

type Range = { start: CalendarDate; end: CalendarDate };

export function App() {
  const [orders, setOrders] = useState(() => makeOrders(5000));
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [range, setRange] = useState<Range | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [shown, setShown] = useState<Order[]>([]);

  // Status and date range filter here; the grid's own search handles the text
  // and reports what it shows through onFilteredDataChange.
  const visible = useMemo(
    () =>
      orders.filter((o) => {
        if (status !== "all" && o.status !== status) return false;
        if (range) {
          const d = parseDate(o.placed);
          if (d.compare(range.start) < 0 || d.compare(range.end) > 0) return false;
        }
        return true;
      }),
    [orders, status, range],
  );

  const revenue = shown.reduce((sum, o) => sum + o.total, 0);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-[var(--rd-color-text-muted)]">
            {shown.length.toLocaleString()} orders · {currency.format(revenue)}
          </p>
        </div>
        <NewOrderDialog
          onCreate={(order) => {
            setOrders((rows) => [order, ...rows]);
            toast({ title: `Order ${order.id} created`, description: `${order.customer}, ${currency.format(order.total)}`, variant: "success" });
          }}
          nextId={`ORD-${String(orders.length + 1).padStart(6, "0")}`}
        />
      </header>

      <section aria-label="Filters" className="flex flex-wrap items-end gap-3">
        <TextField className="w-full sm:w-64" label="Search" placeholder="Order, customer, status…" value={search} onChange={setSearch} />
        <Select className="w-full sm:w-44" label="Status" selectedKey={status} onSelectionChange={(k) => setStatus(String(k))}>
          <SelectItem id="all">All statuses</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} id={s}>
              {s}
            </SelectItem>
          ))}
        </Select>
        <DateRangePicker className="w-full sm:w-80" label="Placed" presets={defaultDateRangePresets} value={range} onChange={setRange} />
        {(search || status !== "all" || range) && (
          <Button
            variant="ghost"
            onPress={() => {
              setSearch("");
              setStatus("all");
              setRange(null);
            }}
          >
            Clear filters
          </Button>
        )}
      </section>

      {selected.length > 0 && (
        <div className="flex items-center gap-3 text-sm" aria-live="polite">
          <span>{selected.length} selected</span>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              setOrders((rows) => rows.map((r) => (selected.includes(r.id) ? { ...r, status: "Shipped" } : r)));
              toast({ title: `Marked ${selected.length} as shipped` });
              setSelected([]);
            }}
          >
            Mark as shipped
          </Button>
        </div>
      )}

      <DataGrid
        label="Orders"
        data={visible}
        columns={columns}
        getRowId={(o) => o.id}
        globalFilter={search}
        selectionMode="multiple"
        selectedRowIds={selected}
        onSelectionChange={setSelected}
        onFilteredDataChange={setShown}
        height={520}
        emptyMessage="No orders match these filters."
        onCellEdit={(e) => setOrders((rows) => rows.map((r) => (r.id === e.rowId ? { ...r, [e.columnId]: e.value } : r)))}
      />

      <ToastRegion />
    </main>
  );
}

function NewOrderDialog({ onCreate, nextId }: { onCreate: (o: Order) => void; nextId: string }) {
  const [customer, setCustomer] = useState<string | null>(null);
  const [total, setTotal] = useState("");
  const [placed, setPlaced] = useState<CalendarDate | null>(() => today(getLocalTimeZone()));
  const reset = () => {
    setCustomer(null);
    setTotal("");
    setPlaced(today(getLocalTimeZone()));
  };

  // Validation is declared on the fields (isRequired, validate). The browser
  // blocks submit until they pass, and each field shows and announces its own
  // error, so onSubmit only runs with valid values.
  return (
    <DialogTrigger onOpenChange={(open) => !open && reset()}>
      <Button>New order</Button>
      <Dialog title="New order" description={`It will be saved as ${nextId}.`}>
        {({ close }) => (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              onCreate({ id: nextId, customer: customer!, status: "Pending", items: 1, total: Math.round(Number(total) * 100) / 100, placed: placed!.toString() });
              close();
            }}
          >
            <Combobox
              label="Customer"
              placeholder="Search customers"
              defaultItems={customers.map((name) => ({ id: name, name }))}
              selectedKey={customer}
              onSelectionChange={(k) => setCustomer(k === null ? null : String(k))}
              isRequired
              errorMessage="Pick a customer."
            >
              {(c) => <ComboboxItem id={c.id}>{c.name}</ComboboxItem>}
            </Combobox>
            <TextField
              label="Total (USD)"
              inputMode="decimal"
              value={total}
              onChange={setTotal}
              isRequired
              validate={(v) => (v && !(Number(v) > 0) ? "Total must be a positive number." : null)}
            />
            <DatePicker label="Placed on" value={placed} onChange={setPlaced} isRequired />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onPress={close}>
                Cancel
              </Button>
              <Button type="submit">Create order</Button>
            </div>
          </form>
        )}
      </Dialog>
    </DialogTrigger>
  );
}
