import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { Tab, TabList, TabPanel, Tabs } from "@rdloom/react";
import { highlight } from "sugar-high";
import { CheckIcon, CopyIcon, DoIcon, DontIcon, FileIcon, LinkIcon } from "./icons";

// The docs' own building blocks: calm, neutral, and the same on every page.

// --- Copy ------------------------------------------------------------------

/** A labelled button that copies text: the whole button is the target, not only its icon. */
export function CopyPill({ text, label, copiedLabel = "Copied", className = "" }: { text: string; label: string; copiedLabel?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard?.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {}
        }}
        className={
          "inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--site-border)] bg-[var(--site-subtle)] px-2.5 text-sm font-medium text-[var(--site-fg)] outline-none transition-colors " +
          "hover:bg-[var(--site-border)]/60 focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] " +
          className
        }
      >
        {copied ? copiedLabel : label}
        {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}

export function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={async () => {
          try {
            await navigator.clipboard?.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {}
        }}
        className={
          "inline-flex size-7 items-center justify-center rounded-md text-[var(--site-muted)] outline-none transition-colors " +
          "hover:bg-[var(--site-border)]/60 hover:text-[var(--site-fg)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] " +
          className
        }
      >
        {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}

// --- Code ------------------------------------------------------------------

export function CodeBlock({
  code,
  label = "Code",
  lang = "tsx",
  title,
  bare = false,
  className = "",
}: {
  code: string;
  label?: string;
  lang?: "tsx" | "shell" | "text";
  /** A file name shown above the code. */
  title?: string;
  /** No border or background: for inside another frame. */
  bare?: boolean;
  className?: string;
}) {
  const text = code.trimEnd();
  const colored = lang === "tsx" ? highlight(text) : null;
  return (
    <figure
      className={
        (bare ? "" : "overflow-hidden rounded-xl border border-[var(--site-border)] bg-[var(--site-subtle)] ") + "group relative text-[13px] " + className
      }
    >
      {title && (
        <figcaption className="flex items-center gap-2 border-b border-[var(--site-border)] px-4 py-2 font-mono text-xs text-[var(--site-muted)]">
          <FileIcon size={14} />
          {title}
        </figcaption>
      )}
      <pre tabIndex={0} aria-label={label} className="overflow-x-auto p-4 pe-12 leading-6 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--rd-color-focus-ring)]">
        {colored ? <code dangerouslySetInnerHTML={{ __html: colored }} /> : <code>{text}</code>}
      </pre>
      <CopyButton text={text} label={`Copy ${label.toLowerCase()}`} className={`absolute end-2 ${title ? "top-11" : "top-2"} opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100`} />
    </figure>
  );
}

// --- Commands, with the package manager remembered across the site ----------------

type Manager = "npm" | "pnpm" | "yarn" | "bun";
const managers: Manager[] = ["npm", "pnpm", "yarn", "bun"];
const ManagerContext = createContext<{ manager: Manager; setManager: (m: Manager) => void }>({ manager: "npm", setManager: () => {} });

export function ManagerProvider({ children }: { children: ReactNode }) {
  const [manager, set] = useState<Manager>("npm");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rdloom-pm") as Manager | null;
      if (saved && managers.includes(saved)) set(saved);
    } catch {}
  }, []);
  const setManager = (m: Manager) => {
    set(m);
    try {
      localStorage.setItem("rdloom-pm", m);
    } catch {}
  };
  return <ManagerContext.Provider value={{ manager, setManager }}>{children}</ManagerContext.Provider>;
}

/** Run a package: `rdloom add alert` becomes npx, pnpm dlx, yarn dlx or bunx. */
export const runCommand = (args: string): Record<Manager, string> => ({
  npm: `npx ${args}`,
  pnpm: `pnpm dlx ${args}`,
  yarn: `yarn dlx ${args}`,
  bun: `bunx ${args}`,
});

/** Add packages: `react-aria-components` becomes npm install, pnpm add, yarn add or bun add. */
export const addCommand = (packages: string): Record<Manager, string> => ({
  npm: `npm install ${packages}`,
  pnpm: `pnpm add ${packages}`,
  yarn: `yarn add ${packages}`,
  bun: `bun add ${packages}`,
});

export function CommandBlock({ commands, label = "Command" }: { commands: Record<Manager, string>; label?: string }) {
  const { manager, setManager } = useContext(ManagerContext);
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--site-border)] bg-[var(--site-subtle)]">
      <Tabs variant="pill" selectedKey={manager} onSelectionChange={(k) => setManager(k as Manager)} className="gap-0">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--site-border)] px-3 py-2">
          <TabList aria-label={`${label}: package manager`}>
            {managers.map((m) => (
              <Tab key={m} id={m}>
                {m}
              </Tab>
            ))}
          </TabList>
          <CopyButton text={commands[manager]} label={`Copy ${label.toLowerCase()}`} />
        </div>
        {managers.map((m) => (
          <TabPanel key={m} id={m} className="outline-none">
            <pre tabIndex={0} aria-label={`${label} for ${m}`} className="overflow-x-auto px-4 py-3.5 text-[13px] leading-6 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--rd-color-focus-ring)]">
              <code>{commands[m]}</code>
            </pre>
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}

// --- Previews ----------------------------------------------------------------

/** A live example in a card, with its code folded underneath until asked for. */
export function Preview({ children, code, label, tall = false, motion = false, flush = false }: { children: ReactNode; code: string; label: string; tall?: boolean; /** Animated example: offer a Still toggle. */ motion?: boolean; /** A whole screen (a block): less padding, and the example may fill the width. */ flush?: boolean }) {
  const [open, setOpen] = useState(false);
  const [still, setStill] = useState(false);
  const id = useId();
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--site-border)]">
      <div className={`relative flex ${tall ? "min-h-[22rem]" : "min-h-48"} min-w-0 items-center justify-center overflow-x-auto bg-[var(--rd-color-surface-default)] ${flush ? "p-3" : "p-8"} ${still ? "rdm-still" : ""}`}>
        {motion && (
          // The same switch the components honour for visitors who prefer reduced motion.
          <button
            type="button"
            aria-pressed={still}
            onClick={() => setStill((s) => !s)}
            className="absolute end-3 top-3 z-10 h-7 rounded-md border border-[var(--site-border)] bg-[var(--site-bg)] px-2.5 text-xs text-[var(--site-muted)] outline-none transition-colors hover:text-[var(--site-fg)] aria-pressed:border-[var(--site-accent)] aria-pressed:text-[var(--site-fg)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
          >
            {still ? "Still: on" : "Still"}
          </button>
        )}
        <div className={`flex min-w-0 max-w-full flex-wrap items-center justify-center gap-4 ${flush ? "w-full" : ""}`}>{children}</div>
      </div>
      <div className="relative border-t border-[var(--site-border)] bg-[var(--site-subtle)]">
        <div id={id} className={open ? "" : "max-h-[8.5rem] overflow-hidden"} inert={!open}>
          <CodeBlock bare code={code} label={label} />
        </div>
        {!open && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-[var(--site-subtle)] via-[var(--site-subtle)]/70 to-transparent pt-16 pb-4">
            <button
              type="button"
              aria-expanded={false}
              aria-controls={id}
              onClick={() => setOpen(true)}
              className="h-8 rounded-lg border border-[var(--site-border)] bg-[var(--site-bg)] px-3 text-sm font-medium shadow-sm outline-none hover:bg-[var(--site-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
            >
              View Code
            </button>
          </div>
        )}
        {open && (
          <div className="flex justify-center border-t border-[var(--site-border)] py-2">
            <button
              type="button"
              aria-expanded
              aria-controls={id}
              onClick={() => setOpen(false)}
              className="h-7 rounded-md px-2.5 text-xs text-[var(--site-muted)] outline-none hover:bg-[var(--site-border)]/60 hover:text-[var(--site-fg)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
            >
              Hide code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Underline tabs, like the rest of the docs: CLI / Manual. */
export function DocTabs({ label, tabs }: { label: string; tabs: Array<{ id: string; title: string; content: ReactNode }> }) {
  return (
    <Tabs variant="underline" defaultSelectedKey={tabs[0].id} className="gap-5">
      <TabList aria-label={label}>
        {tabs.map((t) => (
          <Tab key={t.id} id={t.id}>
            {t.title}
          </Tab>
        ))}
      </TabList>
      {tabs.map((t) => (
        <TabPanel key={t.id} id={t.id} className="outline-none">
          {t.content}
        </TabPanel>
      ))}
    </Tabs>
  );
}

// --- Page furniture ------------------------------------------------------------

export function PageHeader({ title, lead, actions, meta }: { title: ReactNode; lead?: ReactNode; actions?: ReactNode; meta?: ReactNode }) {
  return (
    <div className="loom-grid flex flex-col gap-3 pb-9">
      <div className="flex items-start justify-between gap-4">
        {/* Focused on navigation, so screen readers announce the new page. */}
        <h1 id="page-title" tabIndex={-1} className="font-display text-[34px] leading-[1.1] tracking-[-0.035em] outline-none sm:text-[42px]">
          {title}
        </h1>
        {actions && <div className="flex shrink-0 items-center gap-1.5 pt-0.5">{actions}</div>}
      </div>
      {lead && <p className="max-w-xl text-[17px] leading-7 text-balance text-[var(--site-muted)]">{lead}</p>}
      {meta}
    </div>
  );
}

/** Kept for the guides and the 404 page. */
export function PageTitle({ children, lead }: { children: ReactNode; lead?: ReactNode }) {
  return <PageHeader title={children} lead={lead} />;
}

export function H2({ id, label, children }: { id: string; /** Text for "On this page" when the heading isn't plain text. */ label?: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const name = label ?? (typeof children === "string" ? children : "this section");
  return (
    <h2
      id={id}
      data-label={label ?? (typeof children === "string" ? children : undefined)}
      className="font-display group scroll-mt-20 pt-14 pb-4 text-[24px] leading-8 tracking-[-0.03em]"
    >
      {children}
      {/* A permalink: copies the address of this section, so it can be shared or bookmarked. Shown on hover and on keyboard focus. */}
      <button
        type="button"
        aria-label={`Copy link to ${name}`}
        onClick={async () => {
          const url = `${window.location.origin}${window.location.pathname}#${id}`;
          window.history.replaceState(null, "", `#${id}`);
          try {
            await navigator.clipboard?.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {}
        }}
        className="ms-2 inline-flex size-7 translate-y-[-1px] items-center justify-center rounded-md align-middle text-[var(--site-muted)] opacity-0 outline-none transition-opacity hover:bg-[var(--site-border)]/60 hover:text-[var(--site-fg)] focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] group-hover:opacity-100 pointer-coarse:opacity-100"
      >
        {copied ? <CheckIcon size={15} /> : <LinkIcon size={15} />}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="pb-2 text-base font-semibold tracking-tight">{children}</h3>;
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 text-[15px] leading-7 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4">{children}</div>;
}

export function Muted({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm leading-6 text-[var(--site-muted)] ${className}`}>{children}</p>;
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center rounded-md border border-[var(--site-border)] bg-[var(--site-subtle)] px-2 text-xs font-medium text-[var(--site-muted)]">
      {children}
    </span>
  );
}

export function List({ items, tone }: { items: string[]; tone?: "do" | "dont" }) {
  return (
    <ul className="flex flex-col gap-2.5 text-sm leading-6">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span aria-hidden="true" className={`mt-px shrink-0 ${tone === "do" ? "text-[var(--rd-color-feedback-success)]" : tone === "dont" ? "text-[var(--rd-color-feedback-danger)]" : "text-[var(--site-muted)]"}`}>
            {tone === "do" ? <DoIcon size={16} className="mt-1" /> : tone === "dont" ? <DontIcon size={16} className="mt-1" /> : (
              "•"
            )}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
