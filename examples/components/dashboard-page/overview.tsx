import {
  Badge,
  Button,
  Card,
  Chart,
  DashboardPage,
  EventCalendar,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  type EventCalendarEvent,
} from "@rdloom/react";

const orders = [
  { id: "ORD-4821", customer: "Northwind Studio", total: "$1,240.00", status: "Paid", tone: "success" },
  { id: "ORD-4820", customer: "Harbor & Pine", total: "$386.50", status: "Pending", tone: "warning" },
  { id: "ORD-4819", customer: "Lumen Works", total: "$2,910.00", status: "Paid", tone: "success" },
  { id: "ORD-4818", customer: "Fieldnote Co.", total: "$74.00", status: "Refunded", tone: "neutral" },
  { id: "ORD-4817", customer: "Quarry Labs", total: "$540.25", status: "Failed", tone: "danger" },
] as const;

const activity = [
  { id: "a1", text: "Maya Chen upgraded Harbor & Pine to the Team plan", when: "12 minutes ago" },
  { id: "a2", text: "Invoice INV-2207 was sent to Lumen Works", when: "1 hour ago" },
  { id: "a3", text: "Tomas Reyes left a note on ORD-4817", when: "3 hours ago" },
  { id: "a4", text: "A refund of $74.00 was issued for ORD-4818", when: "Yesterday" },
];

const events: EventCalendarEvent[] = [
  { id: "e1", title: "Quarterly review", start: "2026-10-13T10:00", tone: "info" },
  { id: "e2", title: "Payout run", start: "2026-10-15", allDay: true, tone: "success" },
  { id: "e3", title: "Pricing call", start: "2026-10-15T15:00", tone: "warning" },
  { id: "e4", title: "Tax filing due", start: "2026-10-31", allDay: true, tone: "danger" },
];

export default function DashboardPageOverviewExample() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-[72rem] max-w-full">
        <DashboardPage
          title="Overview"
          description="How the shop did in the last 30 days."
          actions={
            <>
              <Button variant="secondary">Export</Button>
              <Button>New order</Button>
            </>
          }
          stats={[
            { label: "Revenue", value: "$71,400", trend: { change: 12.4, label: "vs last month" }, data: [41, 44, 43, 48, 52, 57, 63, 71] },
            { label: "Orders", value: 1284, trend: { change: 4.1, label: "vs last month" }, data: [90, 96, 94, 101, 99, 108, 112, 118] },
            { label: "Refund rate", value: "1.9%", trend: { change: -0.3, goodWhen: "down", label: "vs last month" }, data: [2.6, 2.4, 2.5, 2.2, 2.1, 2.0, 1.9, 1.9] },
            { label: "New customers", value: 312, trend: { change: 8, label: "vs last month" }, data: [22, 25, 24, 29, 31, 30, 34, 39] },
          ]}
        >
          <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
            <Card title="Revenue" description="Monthly totals for the year" className="lg:col-span-2">
              <Chart
                type="area"
                title="Revenue by month"
                data={{
                  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
                  series: [{ name: "Revenue", values: [21000, 26500, 31000, 29000, 41000, 48000, 46500, 52000, 63000, 71400] }],
                  unit: "$",
                }}
              />
            </Card>
            <Card title="Recent activity" description="What happened today and yesterday">
              <ul className="flex flex-col gap-4">
                {activity.map((item) => (
                  <li key={item.id} className="flex flex-col gap-0.5">
                    <span className="text-sm text-[var(--rd-color-text-default)]">{item.text}</span>
                    <span className="text-xs text-[var(--rd-color-text-muted)]">{item.when}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
            <Card title="Recent orders" description="The latest five" className="lg:col-span-2">
              <Table label="Recent orders">
                <TableHeader>
                  <TableColumn isRowHeader>Order</TableColumn>
                  <TableColumn>Customer</TableColumn>
                  <TableColumn>Total</TableColumn>
                  <TableColumn>Status</TableColumn>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id} id={o.id}>
                      <TableCell>{o.id}</TableCell>
                      <TableCell>{o.customer}</TableCell>
                      <TableCell>{o.total}</TableCell>
                      <TableCell>
                        <Badge variant={o.tone}>{o.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <Card title="Goals this quarter" description="Progress to each target">
              <div className="flex flex-col gap-5">
                <Progress label="Revenue target" value={71} />
                <Progress label="New customers" value={52} />
                <Progress label="Refund rate under 2%" value={95} variant="success" />
              </div>
            </Card>
          </div>

          <Card title="Upcoming" description="Reviews, payouts and deadlines">
            <EventCalendar events={events} defaultMonth="2026-10" today="2026-10-08" label="Business calendar" />
          </Card>
        </DashboardPage>
      </div>
    </div>
  );
}
