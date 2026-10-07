import { useState } from "react";
import {
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Chart,
  ChartIcon,
  CreditCardIcon,
  CustomerTable,
  DashboardPage,
  DashboardShell,
  EmptyState,
  GlobeIcon,
  HomeIcon,
  InboxIcon,
  SettingsIcon,
  SparkleIcon,
  UsersIcon,
  findNavItem,
  trailOf,
  type Customer,
  type NavGroup,
} from "@rdloom/react";

const navigation: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { id: "overview", label: "Dashboard", icon: <HomeIcon /> },
      { id: "customers", label: "Customers", icon: <UsersIcon />, badge: 24 },
      {
        id: "reports",
        label: "Reports",
        icon: <ChartIcon />,
        children: [
          { id: "revenue", label: "Revenue" },
          { id: "retention", label: "Retention" },
          { id: "acquisition", label: "Acquisition" },
        ],
      },
      { id: "inbox", label: "Inbox", icon: <InboxIcon />, badge: 3 },
    ],
  },
  {
    label: "Projects",
    items: [
      { id: "website", label: "Website relaunch", icon: <GlobeIcon /> },
      { id: "planning", label: "Q4 planning", icon: <SparkleIcon /> },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "billing", label: "Billing", icon: <CreditCardIcon /> },
      { id: "settings", label: "Settings", icon: <SettingsIcon /> },
    ],
  },
];

const teams = [
  { id: "loomworks", name: "Loomworks", description: "Enterprise" },
  { id: "northfield", name: "Northfield", description: "Startup" },
  { id: "harbor", name: "Harbor & Co", description: "Free" },
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

function Overview() {
  return (
    <DashboardPage
      title="Dashboard"
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

// The sidebar is the left column of the shell. Items without an href call onNavigate; with an href they are real links.
export default function SidebarFloatingExample() {
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
        onSearch={() => {}}
        sidebarAppearance="floating"
        sidebarFooter={
          <div className="flex flex-col gap-2 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] p-3 text-sm">
            <p className="font-medium">Free plan</p>
            <p className="text-xs text-[var(--rd-color-text-muted)]">8 of 10 seats used.</p>
            <Button size="sm">Upgrade</Button>
          </div>
        }
        header={
          <Breadcrumbs label="You are here">
            <BreadcrumbItem>{navigation.find((g) => g.items.some((i) => i.id === current || i.children?.some((c) => c.id === current)))?.label ?? "Platform"}</BreadcrumbItem>
            <BreadcrumbItem>{trail[trail.length - 1] ?? page.label}</BreadcrumbItem>
          </Breadcrumbs>
        }
      >
        {current === "overview" ? (
          <Overview />
        ) : (
          <DashboardPage title={page.label}>
            <EmptyState title={`${page.label} is yours to build`} description="Put any page here. The sidebar, the top bar and the way they fold on a phone are already done." />
          </DashboardPage>
        )}
      </DashboardShell>
    </div>
  );
}
