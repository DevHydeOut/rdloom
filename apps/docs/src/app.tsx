import { useEffect, useRef, useState } from "react";
import { CommandGroup, CommandItem, CommandPalette, ToastRegion } from "@rdloom/react";
import { components, displayName, repoUrl } from "./data";
import { VisualPage } from "./pages/visual";
import { guides, routeFor, searchEntries } from "./routes";
import { Link, navigate, RouterProvider, usePath } from "./router";
import { ManagerProvider } from "./ui";

const sideLink =
  "block rounded-md px-2.5 py-1.5 text-[13px] leading-5 text-[var(--site-muted)] outline-none transition-colors " +
  "hover:bg-[var(--site-subtle)] hover:text-[var(--site-fg)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] " +
  "aria-[current=page]:bg-[var(--site-subtle)] aria-[current=page]:font-medium aria-[current=page]:text-[var(--site-fg)]";

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-2.5 pb-1.5 text-xs font-medium text-[var(--site-muted)]">{label}</p>
      <ul className="flex flex-col gap-px">{children}</ul>
    </div>
  );
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
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
      <Group label="Components">
        <li>
          <Link href="/components" className={sideLink} onClick={onNavigate}>
            All components
          </Link>
        </li>
        {components.map((c) => (
          <li key={c.id}>
            <Link href={`/components/${c.id}`} className={sideLink} onClick={onNavigate}>
              {displayName(c.spec.name)}
            </Link>
          </li>
        ))}
      </Group>
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
      <p className="pb-3 text-xs font-medium">On This Page</p>
      <ul className="flex flex-col gap-2.5">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              aria-current={active === i.id ? "location" : undefined}
              className="block text-[var(--site-muted)] transition-colors hover:text-[var(--site-fg)] aria-[current=location]:font-medium aria-[current=location]:text-[var(--site-fg)]"
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
        "flex h-9 w-full items-center justify-between gap-6 rounded-lg border border-transparent bg-[var(--site-subtle)] px-3 text-sm text-[var(--site-muted)] outline-none " +
        "transition-colors hover:border-[var(--site-border)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] " +
        className
      }
    >
      <span>Search documentation…</span>
      <kbd className="hidden rounded border border-[var(--site-border)] bg-[var(--site-bg)] px-1.5 font-sans text-[11px] sm:inline">Ctrl K</kbd>
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
      <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18" />
        <path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" />
      </svg>
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
      <header className="sticky top-0 z-20 bg-[var(--site-bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[88rem] items-center gap-6 px-4 sm:px-6">
          <button
            type="button"
            className={`${iconButton} md:hidden`}
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <img src="/favicon.svg" alt="" width="22" height="22" />
            rdloom
          </Link>
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-6 text-sm font-medium">
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
            <a href={repoUrl} aria-label="GitHub repository" className={iconButton}>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
              </svg>
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
          <div className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 pe-2 md:block">
            <Nav />
          </div>
          <main id="main" className="min-w-0 flex-1 py-10 pb-24">
            <div className="mx-auto max-w-[44rem]">{route.page}</div>
          </main>
          <div className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 overflow-y-auto py-10 xl:block">
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
  return visual ? <VisualPage id={visual[1]} name={visual[2]} /> : <Shell />;
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
