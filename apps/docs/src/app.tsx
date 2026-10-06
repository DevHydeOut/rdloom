import { useEffect, useRef, useState } from "react";
import { CommandGroup, CommandItem, CommandPalette, ToastRegion } from "@rdloom/react";
import { componentGroups, displayName, groupIdOf, hrefOf, repoUrl, type ComponentGroup } from "./data";
import { FullScreenPage } from "./pages/blocks";
import { VisualPage } from "./pages/visual";
import { guides, routeFor, searchEntries } from "./routes";
import { Link, navigate, RouterProvider, usePath } from "./router";
import { ArrowRightIcon, ChevronRightIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon } from "./icons";
import { ManagerProvider } from "./ui";

const sideLink =
  "-ms-px block border-s border-transparent py-1.5 ps-3.5 pe-2 text-[13.5px] leading-5 text-[var(--site-muted)] outline-none transition-colors " +
  "hover:border-[var(--site-border-strong)] hover:text-[var(--site-fg)] focus-visible:text-[var(--site-fg)] focus-visible:underline " +
  "aria-[current=page]:border-[var(--site-accent)] aria-[current=page]:font-medium aria-[current=page]:text-[var(--site-fg)]";

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="pb-2.5 font-mono text-[11px] font-medium tracking-[0.09em] text-[var(--site-muted)] uppercase">{label}</p>
      <ul className="flex flex-col border-s border-[var(--site-border)]">{children}</ul>
    </div>
  );
}

function GroupToggle({ group, open, onToggle, onNavigate, path }: { group: ComponentGroup; open: boolean; onToggle: () => void; onNavigate?: () => void; path: string }) {
  const listId = `side-${group.id}`;
  const here = group.items.some((c) => path === hrefOf(c));
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={onToggle}
        className="group/toggle flex w-full items-center gap-2 rounded-md py-1.5 ps-1 pe-2 text-start text-[13.5px] leading-5 font-medium text-[var(--site-fg)] outline-none transition-colors hover:bg-[var(--site-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
      >
        <ChevronRightIcon size={13} className={"shrink-0 text-[var(--site-muted)] transition-transform motion-reduce:transition-none " + (open ? "rotate-90" : "")} />
        <span className="flex-1">{group.label}</span>
        {/* A dot says "you are in here" while the group is closed. */}
        {here && !open && <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--site-accent)]" />}
        <span className="text-xs font-normal text-[var(--site-muted)] tabular-nums">{group.items.length}</span>
      </button>
      {/* Closed groups stay in the page (hidden), so the links are still in the HTML. */}
      <ul id={listId} hidden={!open} className="mb-1 ms-[0.9rem] flex flex-col border-s border-[var(--site-border)]">
        {group.items.map((c) => (
          <li key={c.id}>
            <Link href={hrefOf(c)} className={sideLink} onClick={onNavigate}>
              {displayName(c.spec.name)}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePath();
  const current = path.startsWith("/components/") || path.startsWith("/blocks/") ? groupIdOf(path.split("/")[2]) : undefined;
  const [open, setOpen] = useState<Set<string>>(() => new Set(current ? [current] : []));
  // Going to a component opens its group; the others stay as you left them.
  useEffect(() => {
    if (current) setOpen((s) => (s.has(current) ? s : new Set(s).add(current)));
  }, [current]);
  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const allOpen = componentGroups.every((g) => open.has(g.id));

  return (
    <nav aria-label="Docs" className="flex flex-col gap-7">
      <Group label="Get started">
        {guides.map((g) => (
          <li key={g.href}>
            <Link href={g.href} className={sideLink} onClick={onNavigate}>
              {g.title}
            </Link>
          </li>
        ))}
      </Group>
      <div>
        <div className="flex items-center justify-between pb-2.5">
          <p className="font-mono text-[11px] font-medium tracking-[0.09em] text-[var(--site-muted)] uppercase">Components</p>
          <button
            type="button"
            onClick={() => setOpen(allOpen ? new Set(current ? [current] : []) : new Set(componentGroups.map((g) => g.id)))}
            className="rounded px-1 text-xs text-[var(--site-muted)] outline-none hover:text-[var(--site-fg)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>
        <Link href="/components" className={sideLink + " mb-1 ms-1 rounded-md border-s-0 ps-0.5"} onClick={onNavigate}>
          All components
        </Link>
        <ul className="flex flex-col">
          {componentGroups.map((g) => (
            <GroupToggle key={g.id} group={g} open={open.has(g.id)} onToggle={() => toggle(g.id)} onNavigate={onNavigate} path={path} />
          ))}
        </ul>
      </div>
    </nav>
  );
}

/** "On this page": the h2s of the current page, highlighted as you scroll. */
function Toc({ path }: { path: string }) {
  const [items, setItems] = useState<Array<{ id: string; text: string }>>([]);
  const [active, setActive] = useState<string>();

  useEffect(() => {
    const heads = [...document.querySelectorAll<HTMLElement>("main h2[id]")];
    setItems(heads.map((h) => ({ id: h.id, text: h.dataset.label ?? h.textContent?.replace(/#$/, "") ?? "" })));
    const seen = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    heads.forEach((h) => seen.observe(h));
    return () => seen.disconnect();
  }, [path]);

  if (items.length < 2) return null;
  return (
    // The <nav>s are the landmarks; their wrappers are plain divs so screen
    // readers don't list two unnamed "complementary" regions too.
    <nav aria-label="On this page" className="text-[13px]">
      <p className="pb-2.5 font-mono text-[11px] font-medium tracking-[0.09em] text-[var(--site-muted)] uppercase">On this page</p>
      <ul className="flex flex-col border-s border-[var(--site-border)]">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              aria-current={active === i.id ? "location" : undefined}
              className="-ms-px block border-s border-transparent py-1 ps-3.5 text-[13px] leading-5 text-[var(--site-muted)] transition-colors hover:text-[var(--site-fg)] aria-[current=location]:border-[var(--site-accent)] aria-[current=location]:font-medium aria-[current=location]:text-[var(--site-fg)]"
            >
              {i.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SearchButton({ onOpen, className = "" }: { onOpen: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-keyshortcuts="Control+K Meta+K"
      className={
        "flex h-9 w-full items-center gap-2.5 rounded-lg border border-[var(--site-border)] bg-[var(--site-bg)] px-3 text-sm text-[var(--site-muted)] outline-none " +
        "transition-colors hover:border-[var(--site-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] " +
        className
      }
    >
      <SearchIcon size={15} />
      <span className="flex-1 text-start">Search the docs</span>
      <kbd className="hidden rounded border border-[var(--site-border)] bg-[var(--site-subtle)] px-1.5 text-[10.5px] sm:inline">Ctrl K</kbd>
    </button>
  );
}

/** The site's search is the command palette component: the docs use what they document. */
function Search({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <CommandPalette
      label="Search the docs"
      placeholder="Search documentation…"
      emptyMessage="No pages found."
      isOpen={open}
      onOpenChange={onOpenChange}
      onAction={(key) => navigate(String(key))}
    >
      <CommandGroup title="Guides">
        {searchEntries
          .filter((e) => e.group === "Guides")
          .map((e) => (
            <CommandItem key={e.id} id={e.id}>
              {e.name}
            </CommandItem>
          ))}
      </CommandGroup>
      <CommandGroup title="Components">
        {searchEntries
          .filter((e) => e.group === "Components")
          .map((e) => (
            <CommandItem key={e.id} id={e.id} keywords={"category" in e ? String(e.category) : undefined}>
              {e.name}
            </CommandItem>
          ))}
      </CommandGroup>
      <CommandGroup title="Blocks">
        {searchEntries
          .filter((e) => e.group === "Blocks")
          .map((e) => (
            <CommandItem key={e.id} id={e.id}>
              {e.name}
            </CommandItem>
          ))}
      </CommandGroup>
    </CommandPalette>
  );
}

const iconButton =
  "flex size-8 items-center justify-center rounded-lg text-[var(--site-fg)] outline-none transition-colors hover:bg-[var(--site-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]";

function ThemeToggle() {
  // The inline script in index.html applies the theme before first paint;
  // this only reads it after mount, so prerendered HTML matches hydration.
  const [dark, setDark] = useState<boolean>();
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);
  return (
    <button
      type="button"
      aria-label="Dark mode"
      aria-pressed={dark ?? false}
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.dataset.theme = next ? "dark" : "light";
        document.documentElement.style.colorScheme = next ? "dark" : "light";
        try {
          localStorage.setItem("rdloom-theme", next ? "dark" : "light");
        } catch {}
      }}
      className={iconButton}
    >
      <SunIcon size={17} />
      <MoonIcon size={17} />
    </button>
  );
}

function Shell() {
  const path = usePath();
  const route = routeFor(path);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const first = useRef(true);

  // On navigation: new title and description, back to the top, and focus the
  // page heading so screen readers announce where they are.
  useEffect(() => {
    document.title = route.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", route.description);
    if (first.current) {
      first.current = false;
      return;
    }
    // A link to #something stays on the page: let the browser scroll to it.
    if (!location.hash) scrollTo(0, 0);
    const focusTitle = () => document.getElementById("page-title")?.focus({ preventScroll: true });
    focusTitle();
    // A closing dialog (search) restores focus after its exit animation, to
    // wherever focus was before it opened, often the page body. Take it back.
    const retry = setTimeout(() => {
      if (!document.activeElement || document.activeElement === document.body) focusTitle();
    }, 400);
    return () => clearTimeout(retry);
  }, [path, route.title, route.description]);

  const inComponents = path === "/components" || path.startsWith("/components/");
  const topLinks = [
    { href: "/docs/getting-started", label: "Docs", current: path.startsWith("/docs/") && !path.startsWith("/docs/mcp") && !path.startsWith("/docs/figma") },
    { href: "/components", label: "Components", current: inComponents },
    { href: "/blocks", label: "Blocks", current: path === "/blocks" || path.startsWith("/blocks/") },
    { href: "/docs/mcp", label: "AI agents", current: path.startsWith("/docs/mcp") },
    { href: "/docs/figma", label: "Figma", current: path.startsWith("/docs/figma") },
  ];

  return (
    <div className="docs min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-[var(--site-bg)] focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-[var(--site-border)]/70 bg-[var(--site-bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[88rem] items-center gap-6 px-4 sm:px-6">
          <button
            type="button"
            className={`${iconButton} md:hidden`}
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MenuIcon size={18} />
          </button>
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" width="24" height="24" />
            <span className="font-display text-[22px] leading-none tracking-[-0.04em]">rdloom</span>
          </Link>
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-6 text-sm">
              {topLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    aria-current={l.current ? "page" : undefined}
                    className="text-[var(--site-muted)] transition-colors hover:text-[var(--site-fg)] aria-[current=page]:text-[var(--site-fg)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ms-auto flex items-center gap-1.5">
            <div className="hidden w-64 sm:block lg:w-72">
              <SearchButton onOpen={() => setSearchOpen(true)} />
            </div>
            <a href={repoUrl} className="hidden h-8 items-center gap-1 rounded-lg px-2.5 text-sm text-[var(--site-muted)] outline-none transition-colors hover:text-[var(--site-fg)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] sm:flex">
              GitHub
              <ArrowRightIcon size={13} className="-rotate-45" />
            </a>
            <ThemeToggle />
          </div>
        </div>
        {menuOpen && (
          <div id="mobile-nav" className="max-h-[75vh] overflow-y-auto border-t border-[var(--site-border)] p-4 md:hidden">
            <div className="pb-4 sm:hidden">
              <SearchButton
                onOpen={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
              />
            </div>
            <Nav onNavigate={() => setMenuOpen(false)} />
          </div>
        )}
      </header>

      {route.wide ? (
        <main id="main" className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6">
          {route.page}
        </main>
      ) : (
        <div className="mx-auto flex max-w-[88rem] gap-8 px-4 sm:px-6 lg:gap-12">
          <div className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto py-8 pe-2 md:block thin-scroll">
            <Nav />
          </div>
          <main id="main" className="min-w-0 flex-1 py-10 pb-24">
            <div className="thread mx-auto max-w-[44rem]">{route.page}</div>
          </main>
          <div className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 overflow-y-auto py-10 xl:block thin-scroll">
            <Toc path={path} />
          </div>
        </div>
      )}
      <footer className="border-t border-[var(--site-border)] py-6">
        <p className="mx-auto max-w-[88rem] px-4 text-sm text-[var(--site-muted)] sm:px-6">
          Built by the rdloom team. Every page is generated from the component specs. The source is on{" "}
          <a href={repoUrl} className="underline underline-offset-4">
            GitHub
          </a>
          .
        </p>
      </footer>
      <Search open={searchOpen} onOpenChange={setSearchOpen} />
      <ToastRegion />
    </div>
  );
}

function Root() {
  const path = usePath();
  const visual = path.match(/^\/visual\/([^/]+)\/([^/]+)$/);
  if (visual) return <VisualPage id={visual[1]} name={visual[2]} />;
  const preview = path.match(/^\/preview\/([^/]+)\/([^/]+)$/);
  return preview ? <FullScreenPage id={preview[1]} name={preview[2]} /> : <Shell />;
}

export function App({ path }: { path?: string }) {
  return (
    <ManagerProvider>
      <RouterProvider initialPath={path}>
        <Root />
      </RouterProvider>
    </ManagerProvider>
  );
}
