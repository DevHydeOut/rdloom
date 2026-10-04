import { Button, DialogTrigger, Sheet } from "@rdloom/react";

const links = ["Dashboard", "Orders", "Customers", "Reports", "Settings"];

export default function SheetNavigationExample() {
  return (
    <DialogTrigger>
      <Button variant="secondary">Menu</Button>
      {/* start: the left edge, or the right in right-to-left languages. */}
      <Sheet title="Navigation" side="start" size="sm">
        <nav aria-label="Main">
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l}>
                <a href={`#${l.toLowerCase()}`} className="block rounded-md px-3 py-2 text-sm hover:bg-[var(--rd-color-surface-subtle)]">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Sheet>
    </DialogTrigger>
  );
}
