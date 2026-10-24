import { useState } from "react";
import { BottomNav, HomeIcon, InboxIcon, UserIcon, type NavItem } from "@rdloom/react";

const items: NavItem[] = [
  { id: "home", label: "Home", href: "/", icon: <HomeIcon /> },
  { id: "inbox", label: "Inbox", href: "/inbox", icon: <InboxIcon /> },
  { id: "account", label: "Account", href: "/account", icon: <UserIcon /> },
];

// renderLink hands you the class names and the content; return your router's link (Link in React Router, Next.js and others).
// Here a plain anchor stands in for it and the current place is kept in state.
export default function BottomNavWithYourRouterExample() {
  const [current, setCurrent] = useState("home");
  return (
    <div className="mx-auto flex h-64 w-[22rem] max-w-full flex-col justify-end overflow-hidden rounded-3xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]">
      <BottomNav
        items={items}
        currentId={current}
        renderLink={({ item, className, children, isCurrent, onClick }) => (
          <a
            href={item.href}
            className={className}
            aria-current={isCurrent ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault();
              onClick();
              setCurrent(item.id);
            }}
          >
            {children}
          </a>
        )}
      />
    </div>
  );
}
