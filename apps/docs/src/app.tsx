import { useEffect, useRef, useState } from "react";
import { Combobox, ComboboxItem, Dialog, ToastRegion } from "@rdloom/react";
import { categories, components, repoUrl } from "./data";
import { VisualPage } from "./pages/visual";
import { guides, routeFor, searchEntries } from "./routes";
import { Link, navigate, RouterProvider, usePath } from "./router";

const navLink =
  "block rounded-md px-2 py-1 text-sm text-[var(--site-muted)] hover:text-[var(--site-fg)] aria-[current=page]:font-medium aria-[current=page]:text-[var(--site-fg)]";

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Docs" className="flex flex-col gap-6">
      <div>
        <p className="px-2 pb-1 text-sm font-medium">Getting started</p>
        <ul>
          {guides.map((g) => (
            <li key={g.href}>
              <Link href={g.href} className={navLink} onClick={onNavigate}>
                {g.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {categories.map((cat) => (
        <div key={cat}>
          <p className="px-2 pb-1 text-sm font-medium">{cat[0].toUpperCase() + cat.slice(1)}</p>
          <ul>
            {components
              .filter((c) => c.spec.category === cat)
              .map((c) => (
                <li key={c.id}>
                  <Link href={`/components/${c.id}`} className={navLink} onClick={onNavigate}>
                    {c.spec.name}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** "On this page": the h2s of the current page, highlighted as you scroll. */
function Toc({ path }: { path: string }) {
  const [items, setItems] = useState<Array<{ id: string; text: string }>>([]);
  const [active, setActive] = useState<string>();

  useEffect(() => {
    const heads = [...document.querySelectorAll<HTMLElement>("main h2[id]")];
    setItems(heads.map((h) => ({ id: h.id, text: h.textContent ?? "" })));
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
    <nav aria-label="On this page" className="text-sm">
      <p className="pb-2 font-medium">On this page</p>
      <ul className="flex flex-col gap-1.5">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              aria-current={active === i.id ? "location" : undefined}
              className="text-[var(--site-muted)] hover:text-[var(--site-fg)] aria-[current=location]:text-[var(--site-fg)]"
            >
              {i.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SearchButton() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-keyshortcuts="Control+K Meta+K"
        className="flex h-8 w-full items-center justify-between gap-6 rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-bg)] px-3 text-sm text-[var(--site-muted)] hover:bg-[var(--site-subtle)] hover:text-[var(--site-fg)] sm:w-56"
      >
        <span>Search docs…</span>
        <kbd className="hidden rounded border border-[var(--site-border)] bg-[var(--site-bg)] px-1.5 font-sans text-[11px] sm:inline">Ctrl K</kbd>
      </button>
      <Dialog title="Search" isOpen={open} onOpenChange={setOpen} isDismissable size="sm">
        <Combobox
          label="Pages and components"
          placeholder="Type a component or guide"
          defaultItems={searchEntries}
          menuTrigger="focus"
          autoFocus
          onSelectionChange={(key) => {
            if (key == null) return;
            setOpen(false);
            navigate(String(key));
          }}
        >
          {(e) => (
            <ComboboxItem id={e.id} textValue={e.name}>
              <span className="flex w-full justify-between gap-4">
                {e.name}
                <span className="text-xs text-[var(--site-muted)]">{e.group}</span>
              </span>
            </ComboboxItem>
          )}
        </Combobox>
      </Dialog>
    </>
  );
}

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
      className="flex size-8 items-center justify-center rounded-[var(--site-radius)] hover:bg-[var(--site-subtle)]"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}

function Shell() {
  const path = usePath();
  const route = routeFor(path);
  const [menuOpen, setMenuOpen] = useState(false);
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
    scrollTo(0, 0);
    const focusTitle = () => document.getElementById("page-title")?.focus();
    focusTitle();
    // A closing dialog (search) restores focus after its exit animation, to
    // wherever focus was before it opened, often the page body. Take it back.
    const retry = setTimeout(() => {
      if (!document.activeElement || document.activeElement === document.body) focusTitle();
    }, 400);
    return () => clearTimeout(retry);
  }, [path, route.title, route.description]);

  const topLinks = [
    { href: "/docs/getting-started", label: "Docs" },
    { href: "/components/button", label: "Components" },
    { href: "/docs/mcp", label: "AI agents" },
    { href: "/docs/figma", label: "Figma" },
  ];

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-[var(--site-bg)] focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-[var(--site-border)] bg-[var(--site-bg)]/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4 sm:px-6">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-[var(--site-radius)] hover:bg-[var(--site-subtle)] md:hidden"
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <img src="/favicon.svg" alt="" width="22" height="22" />
            rdloom
          </Link>
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-5 text-sm">
              {topLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[var(--site-muted)] hover:text-[var(--site-fg)] aria-[current=page]:text-[var(--site-fg)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <div className="hidden sm:block">
              <SearchButton />
            </div>
            <a
              href={repoUrl}
              className="flex h-8 items-center rounded-[var(--site-radius)] px-2 text-sm text-[var(--site-muted)] hover:bg-[var(--site-subtle)] hover:text-[var(--site-fg)]"
            >
              GitHub
            </a>
            <ThemeToggle />
          </div>
        </div>
        {menuOpen && (
          <div id="mobile-nav" className="max-h-[75vh] overflow-y-auto border-t border-[var(--site-border)] p-4 md:hidden">
            <div className="pb-4 sm:hidden">
              <SearchButton />
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
        <div className="mx-auto flex max-w-screen-2xl gap-10 px-4 sm:px-6">
          <div className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 overflow-y-auto border-e border-[var(--site-border)] py-8 pe-4 md:block">
            <Nav />
          </div>
          <main id="main" className="min-w-0 flex-1 py-10 pb-24">
            <div className="mx-auto max-w-3xl">{route.page}</div>
          </main>
          <div className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-48 shrink-0 overflow-y-auto py-10 xl:block">
            <Toc path={path} />
          </div>
        </div>
      )}
      <footer className="border-t border-[var(--site-border)] py-6">
        <p className="mx-auto max-w-screen-2xl px-4 text-sm text-[var(--site-muted)] sm:px-6">
          Built by the rdloom team. Every page is generated from the component specs. The source is on{" "}
          <a href={repoUrl} className="underline underline-offset-4">
            GitHub
          </a>
          .
        </p>
      </footer>
      <ToastRegion />
    </>
  );
}

function Root() {
  const path = usePath();
  const visual = path.match(/^\/visual\/([^/]+)\/([^/]+)$/);
  return visual ? <VisualPage id={visual[1]} name={visual[2]} /> : <Shell />;
}

export function App({ path }: { path?: string }) {
  return (
    <RouterProvider initialPath={path}>
      <Root />
    </RouterProvider>
  );
}
