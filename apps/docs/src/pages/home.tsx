import { Suspense, useContext } from "react";
import { components, EagerExamples, hrefOf } from "../data";
import { faq } from "../faq";
import { Link } from "../router";
import { CodeBlock } from "../ui";

const pillars = [
  {
    title: "The hard components, done right",
    body: "DateRangePicker with presets, a Combobox with async search and tags, a DataGrid that stays fast at 100,000 rows. Built on React Aria, tested with axe.",
  },
  {
    title: "You own the code, and it still upgrades",
    body: "rdloom add copies the source into your project. rdloom upgrade merges new versions into your edits, like git, instead of overwriting them.",
  },
  {
    title: "One spec for code, design and docs",
    body: "Each component is defined once. Its types, tokens, Figma variants, this site and the accessibility checklist are all generated from that spec.",
  },
  {
    title: "Made for AI coding agents",
    body: "An MCP server gives Claude Code, Cursor and others the props, usage rules, accessibility requirements and tested examples, so they write correct code.",
  },
];

// What people come here to build, written the way they would search for it, each linking to the real block.
const uses = [
  { href: "/blocks/dashboard-shell", title: "Admin dashboards", body: "A sidebar, a top bar, stat cards, charts and tables that fold down to a phone." },
  { href: "/blocks/data-table", title: "Data tables with search and filters", body: "Sorting, filters, pages, bulk actions and row menus, with permissions per action." },
  { href: "/components/form", title: "Forms that validate", body: "Fields, error summaries and repeating rows that work with a keyboard and a screen reader." },
  { href: "/blocks/settings-section", title: "Settings and billing pages", body: "Settings sections, plan pickers, usage meters, payment methods and API keys." },
  { href: "/blocks/auth-card", title: "Sign-in and sign-up screens", body: "Sign in, sign up, forgot password and one-time code screens in several layouts." },
  { href: "/blocks/invite-dialog", title: "User management and invites", body: "Invite people by email, search a directory, pick from a list and assign roles." },
  { href: "/blocks/event-calendar", title: "Calendars and booking", body: "A month calendar with events, and a time slot picker for appointments." },
  { href: "/docs/ai", title: "AI chat and agent screens", body: "Chat, streaming replies, tool steps, approvals, sources, tables and charts." },
];

const showcase = [
  { id: "date-range-picker", example: "with-presets", title: "DateRangePicker", note: "Presets, typed or picked, one month on phones" },
  { id: "combobox", example: "multiple", title: "Combobox", note: "Tags, async search, 5,000+ options" },
  { id: "data-grid", example: "selection", title: "DataGrid", note: "Sorting, selection, editing, 100k rows" },
  { id: "dialog", example: "form", title: "Dialog", note: "Focus trapped and restored, validated form" },
];

function Showcase({ id, example }: { id: string; example: string }) {
  const found = components.find((c) => c.id === id)?.examples.find((e) => e.name === example);
  const Example = useContext(EagerExamples)?.[`${id}/${example}`] ?? found?.Component;
  if (!Example) return null;
  return (
    <Suspense fallback={<span className="text-sm text-[var(--site-muted)]">Loading…</span>}>
      <Example />
    </Suspense>
  );
}

export function Home() {
  return (
    <div className="flex flex-col gap-14">
      <section className="loom-grid loom-grid-wide flex flex-col items-center gap-6 pt-10 pb-4 text-center">
        <Link
          href="/components/data-grid"
          className="rounded-full border border-[var(--site-border)] bg-[var(--site-bg)] px-3.5 py-1 text-sm text-[var(--site-muted)] transition-colors hover:border-[var(--site-accent)] hover:text-[var(--site-fg)]"
        >
          New: DataGrid search matches formatted values →
        </Link>
        <h1 id="page-title" tabIndex={-1} className="font-display max-w-4xl text-[40px] leading-[1.05] tracking-[-0.045em] text-balance outline-none sm:text-[68px]">
          Production-ready React blocks you copy and own.
        </h1>
        <p className="max-w-2xl text-[19px] leading-8 text-balance text-[var(--site-muted)]">
          For ERP, SaaS and B2B apps: data tables, forms, settings, billing, sign-in and dashboards. Accessible, tested, and yours to change, with upgrades that merge into your edits.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/docs/getting-started" className="rounded-lg bg-[var(--site-accent)] px-5 py-2.5 font-medium text-[var(--site-on-accent)] transition-opacity hover:opacity-90">
            Get started
          </Link>
          <Link href="/components/data-grid" className="rounded-lg border border-[var(--site-border-strong)] px-5 py-2.5 font-medium transition-colors hover:bg-[var(--site-subtle)]">
            See the DataGrid
          </Link>
        </div>
        <div className="w-full max-w-xl text-start">
          <CodeBlock code={"npx rdloom init\nnpx rdloom add date-range-picker data-grid --install"} label="Quick start" />
        </div>
      </section>

      <section aria-labelledby="live" className="flex flex-col gap-4">
        <h2 id="live" className="font-display text-[26px] leading-9 tracking-[-0.03em]">
          The hard ones, live
        </h2>
        {/* grid-cols-1 and min-w-0: without them the DataGrid's width stretches the card past a phone screen. */}
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {showcase.map((s) => (
            <li key={s.id} className="flex min-w-0 flex-col rounded-[var(--site-radius-lg)] border border-[var(--site-border)]">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-[var(--site-border)] px-5 py-3">
                <Link href={`/components/${s.id}`} className="font-medium hover:underline">
                  {s.title}
                </Link>
                <span className="text-sm text-[var(--site-muted)]">{s.note}</span>
              </div>
              <div className="flex min-h-40 flex-1 items-center justify-center-safe overflow-x-auto p-6">
                <Showcase id={s.id} example={s.example} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="build" className="flex flex-col gap-4">
        <h2 id="build" className="font-display text-[26px] leading-9 tracking-[-0.03em]">
          What you can build with it
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {uses.map((u) => (
            <li key={u.href} className="rounded-[var(--site-radius-lg)] border border-[var(--site-border)] p-5">
              <h3 className="pb-2 font-medium">
                <Link href={u.href} className="hover:underline">
                  {u.title}
                </Link>
              </h3>
              <p className="text-sm text-[var(--site-muted)]">{u.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="why" className="flex flex-col gap-4">
        <h2 id="why" className="font-display text-[26px] leading-9 tracking-[-0.03em]">
          Why rdloom
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {pillars.map((p) => (
            <li key={p.title} className="rounded-[var(--site-radius-lg)] border border-[var(--site-border)] p-5">
              <h3 className="pb-2 font-medium">{p.title}</h3>
              <p className="text-sm text-[var(--site-muted)]">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="faq" className="flex flex-col gap-4">
        <h2 id="faq" className="font-display text-[26px] leading-9 tracking-[-0.03em]">
          Questions
        </h2>
        <div className="flex flex-col divide-y divide-[var(--site-border)] rounded-[var(--site-radius-lg)] border border-[var(--site-border)]">
          {faq.map((item) => (
            <details key={item.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] [&::-webkit-details-marker]:hidden">
                {item.q}
                <span aria-hidden="true" className="text-[var(--site-muted)] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pt-3 text-[var(--site-muted)]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="all" className="flex flex-col gap-4">
        <h2 id="all" className="font-display text-[26px] leading-9 tracking-[-0.03em]">
          {components.length} components
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {components.map((c) => (
            <li key={c.id}>
              <Link
                href={hrefOf(c)}
                className="flex h-full flex-col gap-1 rounded-[var(--site-radius)] border border-[var(--site-border)] p-4 hover:border-[var(--site-border-strong)]"
              >
                <span className="font-medium">{c.spec.name}</span>
                <span className="text-sm text-[var(--site-muted)]">{c.spec.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
