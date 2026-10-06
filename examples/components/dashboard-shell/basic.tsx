import { useState } from "react";
import { Button, Chart, ChartIcon, CreditCardIcon, DashboardPage, DashboardShell, EmptyState, HomeIcon, InboxIcon, SettingsIcon, UsersIcon, type NavGroup } from "@rdloom/react";

const navigation: NavGroup[] = [
  {
    items: [
      { id: "overview", label: "Overview", icon: <HomeIcon /> },
      { id: "customers", label: "Customers", icon: <UsersIcon />, badge: 24 },
      { id: "revenue", label: "Revenue", icon: <ChartIcon /> },
      { id: "inbox", label: "Inbox", icon: <InboxIcon />, badge: 3 },
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

// The shell fills its parent: give it a height (here a box, in an app usually the whole screen).
// Items without an href call onNavigate; with an href they are real links.
export default function DashboardShellBasicExample() {
  const [current, setCurrent] = useState("overview");
  const page = navigation.flatMap((g) => g.items).find((i) => i.id === current)!;

  return (
    <div className="h-[36rem] w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <DashboardShell
        navigation={navigation}
        currentId={current}
        onNavigate={(item) => setCurrent(item.id)}
        brand="Acme Cloud"
        user={{ name: "Ada Lovelace", email: "ada@example.com", menu: [{ id: "profile", label: "Your profile", onSelect: () => {} }, { id: "out", label: "Sign out", onSelect: () => {}, variant: "danger" }] }}
        onSearch={() => {}}
        actions={<Button size="sm">New report</Button>}
      >
        {current === "overview" ? (
          <DashboardPage
            title="Overview"
            description="How the business did this month."
            stats={[
              { label: "Monthly revenue", value: "$48,200", trend: { change: 12, label: "vs last month" }, data: [31, 34, 33, 38, 41, 44, 48] },
              { label: "Customers", value: 1284, trend: { change: 3.2, label: "vs last month" } },
              { label: "Churn", value: "1.8%", trend: { change: -0.4, goodWhen: "down", label: "vs last month" } },
              { label: "Open tickets", value: 17, description: "5 need a reply" },
            ]}
          >
            <Chart
              title="Revenue, last 7 months"
              type="area"
              data={{ labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"], series: [{ name: "Revenue", values: [31000, 34000, 33000, 38000, 41000, 44000, 48200] }], unit: "$" }}
            />
          </DashboardPage>
        ) : (
          <DashboardPage title={page.label}>
            <EmptyState title={`${page.label} is yours to build`} description="Put any page here. The sidebar, the top bar and the way they fold on a phone are already done." />
          </DashboardPage>
        )}
      </DashboardShell>
    </div>
  );
}
