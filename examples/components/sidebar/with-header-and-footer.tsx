import { useState } from "react";
import {
  Badge,
  BellIcon,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Chart,
  ChartIcon,
  CreditCardIcon,
  CustomerTable,
  DashboardPage,
  DashboardShell,
  findNavItem,
  GlobeIcon,
  HomeIcon,
  InboxIcon,
  SettingsIcon,
  SparkleIcon,
  trailOf,
  UsersIcon,
  type Customer,
  type NavGroup,
} from "@rdloom/react";

const navigation: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { id: "overview", label: "Dashboard", icon: <HomeIcon /> },
      { id: "customers", label: "Customers", icon: <UsersIcon /> },
      { id: "reports", label: "Reports", icon: <ChartIcon /> },
      { id: "settings", label: "Settings", icon: <SettingsIcon /> },
    ],
  },
];

const people = ["Ada Lovelace", "Grace Hopper", "Katherine Johnson", "Alan Turing", "Margaret Hamilton", "Dennis Ritchie", "Barbara Liskov", "Edsger Dijkstra"];
const customers: Customer[] = people.map((name, i) => ({
  id: `c${i}`,
  name,
  email: `${name.split(" ")[0].toLowerCase()}@example.com`,
  company: ["Analytical Co", "Compiler Labs", "Orbit Systems", "Enigma Works"][i % 4],
  plan: ["Free", "Pro", "Team", "Enterprise"][i % 4],
  status: ["active", "active", "trial", "overdue"][i % 4],
  mrr: [0, 29, 99, 499][i % 4],
  joinedAt: `2026-0${1 + (i % 7)}-${String(4 + i * 3).padStart(2, "0")}`,
}));

const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// A stand-in page so the sidebar is seen next to real content. Replace it with your own.
function Overview({ title }: { title: string }) {
  return (
    <DashboardPage
      title={title}
      description="How the business is doing this week."
      actions={
        <>
          <Button variant="secondary">Export</Button>
          <Button>New report</Button>
        </>
      }
      stats={[
        { label: "Revenue", value: "$48,200", trend: { change: 12.5 }, summary: "Up on last week" },
        { label: "New customers", value: 1234, trend: { change: -4 }, summary: "A quiet week" },
        { label: "Active accounts", value: 45678, trend: { change: 8.1 }, summary: "Retention is steady" },
      ]}
    >
      <div className="rounded-2xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-5 [box-shadow:var(--rd-elevation-raised)]">
        <Chart
          type="area"
          title="Visitors"
          description="Desktop and mobile, this week"
          height={240}
          data={{
            labels: week,
            series: [
              { name: "Desktop", values: [320, 410, 380, 520, 480, 360, 300] },
              { name: "Mobile", values: [210, 260, 300, 340, 390, 420, 380] },
            ],
          }}
        />
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">Recent customers</h2>
        <CustomerTable customers={customers} insights="none" pageSize={5} locale="en-US" />
      </div>
    </DashboardPage>
  );
}

const teams = [
  { id: "loomworks", name: "Loomworks", description: "Enterprise" },
  { id: "northfield", name: "Northfield", description: "Startup" },
];

// The header is the workspace switcher (two or more teams make it a menu). The footer holds a plan notice above the account menu.
export default function SidebarWithHeaderAndFooterExample() {
  const [current, setCurrent] = useState("overview");
  const [team, setTeam] = useState(teams[0]);
  const page = findNavItem(navigation, current)!;
  const trail = trailOf(navigation, current);

  return (
    <div className="h-full w-full">
      <DashboardShell
        navigation={navigation}
        currentId={current}
        onNavigate={(item) => setCurrent(item.id)}
        team={team}
        teams={teams}
        onTeamChange={(t) => setTeam(teams.find((x) => x.id === t.id) ?? teams[0])}
        user={{ name: "Ada Lovelace", email: "ada@example.com", menu: [{ id: "profile", label: "Your profile", onSelect: () => {} }, { id: "out", label: "Sign out", onSelect: () => {}, variant: "danger" }] }}
        sidebarAppearance="bordered"
        sidebarFooter={
          <div className="flex flex-col gap-2 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)] p-3 text-sm">
            <p className="font-medium">Trial ends in 6 days</p>
            <p className="text-[var(--rd-color-text-muted)]">Pick a plan to keep your data and your team.</p>
            <Button size="sm">See plans</Button>
          </div>
        }
        header={
          <Breadcrumbs label="You are here">
            <BreadcrumbItem>{trail.length > 1 ? trail[0] : "Workspace"}</BreadcrumbItem>
            <BreadcrumbItem>{trail[trail.length - 1] ?? page.label}</BreadcrumbItem>
          </Breadcrumbs>
        }
      >
        <Overview title={page.label} />
      </DashboardShell>
    </div>
  );
}
