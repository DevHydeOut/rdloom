import { useState, type ReactNode } from "react";
import { DashboardPage, DashboardShell, HomeIcon, SettingsIcon, UsersIcon, type NavGroup } from "@rdloom/react";

const navigation: NavGroup[] = [
  {
    items: [
      { id: "/", label: "Home", href: "/", icon: <HomeIcon /> },
      { id: "/people", label: "People", href: "/people", icon: <UsersIcon /> },
      { id: "/settings", label: "Settings", href: "/settings", icon: <SettingsIcon /> },
    ],
  },
];

// Items with an href are plain links. To use your router's link instead (Next.js, React Router, TanStack Router),
// give renderLink: draw your own Link with the className and children you are handed. Here a stand-in
// router just keeps the path in state.
export default function DashboardShellWithYourRouterExample() {
  const [path, setPath] = useState("/people");

  const Link = ({ href, className, children, onClick }: { href: string; className: string; children: ReactNode; onClick: () => void }) => (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        event.preventDefault(); // your router takes over from the browser here
        setPath(href);
        onClick();
      }}
    >
      {children}
    </a>
  );

  return (
    <div className="h-[28rem] w-full overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <DashboardShell
        navigation={navigation}
        currentId={path}
        brand="Acme Cloud"
        renderLink={({ item, className, children, onClick }) => (
          <Link href={item.href!} className={className} onClick={onClick}>
            {children}
          </Link>
        )}
      >
        <DashboardPage title={navigation[0].items.find((i) => i.id === path)?.label ?? "Home"} description={`The address is ${path}.`} />
      </DashboardShell>
    </div>
  );
}
