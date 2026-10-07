import { useState } from "react";
import { Button, ChartIcon, HomeIcon, Sidebar, UsersIcon, type NavGroup } from "@rdloom/react";

const navigation: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { id: "home", label: "Home", icon: <HomeIcon /> },
      { id: "people", label: "People", icon: <UsersIcon />, badge: "New" },
      {
        id: "reports",
        label: "Reports",
        icon: <ChartIcon />,
        children: [
          { id: "revenue", label: "Revenue" },
          { id: "retention", label: "Retention" },
        ],
      },
    ],
  },
];

const teams = [
  { id: "acme", name: "Acme Inc", description: "Enterprise" },
  { id: "monsters", name: "Monsters Ltd", description: "Startup" },
];

// The workspace switcher, a search button, a footer card and the account menu, all optional.
export default function SidebarWorkspaceAndAccountExample() {
  const [current, setCurrent] = useState("retention");
  const [team, setTeam] = useState(teams[0]);
  return (
    <div className="h-[36rem]">
      <Sidebar
        navigation={navigation}
        currentId={current}
        onNavigate={(item) => setCurrent(item.id)}
        team={team}
        teams={teams}
        onTeamChange={(next) => setTeam(teams.find((t) => t.id === next.id) ?? teams[0])}
        onSearch={() => {}}
        footer={
          <div className="flex flex-col gap-2 rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] p-3 text-sm">
            <p className="font-medium">Free plan</p>
            <p className="text-xs text-[var(--rd-color-text-muted)]">8 of 10 seats used.</p>
            <Button size="sm">Upgrade</Button>
          </div>
        }
        user={{ name: "Ada Lovelace", email: "ada@example.com", menu: [{ id: "profile", label: "Your profile", onSelect: () => {} }, { id: "out", label: "Sign out", onSelect: () => {}, variant: "danger" }] }}
      />
    </div>
  );
}
