import { useState } from "react";
import { TopNav, type NavItem } from "@rdloom/react";

const items: NavItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "customers", label: "Customers", href: "/customers" },
  { id: "invoices", label: "Invoices", href: "/invoices" },
];

// Draw the links with your router. A plain anchor stands in for it here; use your router link and give it the
// className and children you are handed. Call onClick so the bar can report the choice.
export default function TopNavWithYourRouterExample() {
  const [path, setPath] = useState("/customers");
  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--rd-color-border-default)]">
      <TopNav
        brand="Loomworks"
        items={items}
        currentId={items.find((item) => item.href === path)?.id}
        variant="bordered"
        renderLink={({ item, className, children, isCurrent, onClick }) => (
          <a
            href={item.href}
            aria-current={isCurrent ? "page" : undefined}
            className={className}
            onClick={(event) => {
              event.preventDefault();
              setPath(item.href ?? "/");
              onClick();
            }}
          >
            {children}
          </a>
        )}
      />
      <p className="p-4 text-sm text-[var(--rd-color-text-muted)]">You are at {path}</p>
    </div>
  );
}
