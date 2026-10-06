import { useMemo, useState } from "react";
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
  SegmentedControl,
  SegmentedControlItem,
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
      { id: "revenue", label: "Revenue", icon: <ChartIcon /> },
      { id: "inbox", label: "Inbox", icon: <InboxIcon />, badge: 3 },
    ],
  },
  {
    label: "Projects",
    items: [
      { id: "design", label: "Design Engineering", icon: <SparkleIcon /> },
      { id: "sales", label: "Sales & Marketing", icon: <ChartIcon /> },
      { id: "travel", label: "Travel", icon: <GlobeIcon /> },
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
  { id: "acme", name: "Acme Inc", description: "Enterprise" },
  { id: "monsters", name: "Monsters Ltd", description: "Startup" },
  { id: "evil", name: "Evil Corp", description: "Free" },
];

// Deterministic daily numbers: a slow wave plus some wobble, so the chart has a shape worth looking at.
function visitors(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(Date.UTC(2026, 6, 31) - (days - 1 - i) * 86_400_000);
    const wave = Math.sin(i / 6) * 90 + Math.sin(i / 2.3) * 45;
    return { label: day.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }), desktop: Math.round(360 + wave + (i % 7) * 12), mobile: Math.round(210 + wave * 0.6 + (i % 5) * 9) };
  });
}

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

const RANGES = { "90": "Last 3 months", "30": "Last 30 days", "7": "Last 7 days" } as const;
// A list, not Object.keys: numeric-looking keys would be sorted by number, and the widest range should come first.
const ORDER = ["90", "30", "7"] as const;

function Overview() {
  const [range, setRange] = useState<keyof typeof RANGES>("90");
  const data = useMemo(() => visitors(Number(range)), [range]);
  return (
    <DashboardPage
      title="Dashboard"
      description="How the business is doing this month."
      actions={
        <>
          <Button variant="secondary">Export</Button>
          <Button>New report</Button>
        </>
      }
      stats={[
        { label: "Total revenue", value: "$1,250.00", trend: { change: 12.5 }, summary: "Trending up this month", description: "Visitors for the last 6 months" },
        { label: "New customers", value: 1234, trend: { change: -20 }, summary: "Down 20% this period", description: "Acquisition needs attention" },
        { label: "Active accounts", value: 45678, trend: { change: 12.5 }, summary: "Strong user retention", description: "Engagement exceeds targets" },
        { label: "Growth rate", value: "4.5%", trend: { change: 4.5 }, summary: "Steady performance increase", description: "Meets growth projections" },
      ]}
    >
      <div className="rounded-2xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-5 [box-shadow:var(--rd-elevation-raised)]">
        <Chart
          type="area"
          title="Total visitors"
          description={`Total for ${RANGES[range].toLowerCase()}`}
          height={260}
          actions={
            <SegmentedControl label="Time range" selectedKey={range} onChange={(key) => setRange(String(key) as keyof typeof RANGES)} size="sm">
              {ORDER.map((key) => (
                <SegmentedControlItem key={key} id={key}>
                  {RANGES[key]}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          }
          data={{ labels: data.map((d) => d.label), series: [{ name: "Desktop", values: data.map((d) => d.desktop) }, { name: "Mobile", values: data.map((d) => d.mobile) }] }}
        />
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-[-0.01em]">Recent customers</h2>
        <CustomerTable customers={customers} insights="none" pageSize={5} locale="en-US" />
      </div>
    </DashboardPage>
  );
}

// The shell fills its parent. Items without an href call onNavigate; with an href they are real links.
export default function DashboardShellBasicExample() {
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
        brand={team.name}
        team={team}
        teams={teams}
        onTeamChange={(t) => setTeam(teams.find((x) => x.id === t.id) ?? teams[0])}
        user={{ name: "Ada Lovelace", email: "ada@example.com", menu: [{ id: "profile", label: "Your profile", onSelect: () => {} }, { id: "out", label: "Sign out", onSelect: () => {}, variant: "danger" }] }}
        onSearch={() => {}}
        header={
          <Breadcrumbs label="You are here">
            <BreadcrumbItem>{navigation.find((g) => g.items.some((i) => i.id === current))?.label ?? "Platform"}</BreadcrumbItem>
            <BreadcrumbItem>{trail[trail.length - 1] ?? page.label}</BreadcrumbItem>
          </Breadcrumbs>
        }
      >
        {current === "overview" ? (
          <Overview />
        ) : (
          <DashboardPage title={page.label}>
            <EmptyState title={`${page.label} is yours to build`} description="Put any page here. The sidebar, the top bar, the breadcrumb and the way they fold on a phone are already done." />
          </DashboardPage>
        )}
      </DashboardShell>
    </div>
  );
}
