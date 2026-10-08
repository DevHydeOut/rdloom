import { useRef, useState } from "react";
import { Button, HomeIcon, MenuIcon, Sheet, Sidebar, Skeleton, UsersIcon, type NavGroup } from "@rdloom/react";

const navigation: NavGroup[] = [
  {
    items: [
      { id: "home", label: "Home", icon: <HomeIcon /> },
      { id: "customers", label: "Customers", icon: <UsersIcon /> },
    ],
  },
];

const card = "flex flex-col gap-3 rounded-xl border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-4";

// On a phone, put the same Sidebar in a Sheet. onPick closes the sheet after an item is chosen. DashboardShell does
// this for you; use this when you build your own frame. portalContainer draws the sheet inside the frame (a relative,
// overflow-hidden element) instead of over the whole window; leave it out in a real app. Held in state, so the sheet
// renders once the frame exists. The sheet starts open here so the preview shows it; the Menu button toggles it.
export default function SidebarInASheetExample() {
  const [current, setCurrent] = useState("home");
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(true);
  const menuButton = useRef<HTMLButtonElement>(null);
  // The sheet starts open, so the browser has no earlier focus to go back to: send focus to the Menu button on close.
  const change = (next: boolean) => {
    setOpen(next);
    if (!next) requestAnimationFrame(() => menuButton.current?.focus());
  };
  return (
    <div ref={setFrame} className="relative h-full w-full overflow-hidden bg-[var(--rd-color-surface-subtle)]">
      <>
        <header className="flex h-16 items-center gap-4 border-b border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] px-4 sm:px-8">
          <Button ref={menuButton} variant="ghost" className="px-2" aria-label="Open navigation" aria-expanded={open} onPress={() => change(!open)}>
            <MenuIcon className="size-5" />
          </Button>
          <span className="text-base font-semibold">Acme Cloud</span>
          <nav aria-label="Site" className="ms-6 hidden items-center gap-6 text-sm text-[var(--rd-color-text-muted)] md:flex">
            <a href="#product" className="hover:text-[var(--rd-color-text-default)]">Product</a>
            <a href="#pricing" className="hover:text-[var(--rd-color-text-default)]">Pricing</a>
            <a href="#docs" className="hover:text-[var(--rd-color-text-default)]">Docs</a>
            <a href="#blog" className="hover:text-[var(--rd-color-text-default)]">Blog</a>
          </nav>
          <div className="ms-auto">
            <Button size="sm">Get started</Button>
          </div>
        </header>
        {frame && (
          <Sheet title="Menu" side="start" size="sm" portalContainer={frame} isOpen={open} onOpenChange={change}>
            {({ close }) => (
              <div className="-m-6 h-[calc(100%+3rem)]">
                <Sidebar navigation={navigation} currentId={current} onNavigate={(item) => setCurrent(item.id)} onPick={close} brand="Acme Cloud" collapsible={false} appearance="subtle" className="[--rd-sidebar-width:100%]" />
              </div>
            )}
          </Sheet>
        )}
      </>
      <div aria-hidden="true" className="flex flex-col gap-10 overflow-hidden px-4 py-12 sm:px-8">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4">
          <Skeleton variant="rect" width="70%" height={36} />
          <Skeleton variant="text" lines={2} width="90%" />
          <div className="flex gap-3 pt-2">
            <Skeleton variant="rect" width={120} height={40} />
            <Skeleton variant="rect" width={120} height={40} />
          </div>
        </div>
        <Skeleton variant="rect" height={220} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={card}>
              <Skeleton variant="circle" width={40} />
              <Skeleton variant="rect" width="60%" height={16} />
              <Skeleton variant="text" lines={3} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
