import { Suspense, useContext } from "react";
import { components, EagerExamples } from "../data";
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
      <section className="flex flex-col items-center gap-5 pt-6 text-center">
        <Link
          href="/components/data-grid"
          className="rounded-full border border-[var(--site-border)] px-3 py-1 text-sm text-[var(--site-muted)] hover:text-[var(--site-fg)]"
        >
          New: DataGrid search matches formatted values →
        </Link>
        <h1 id="page-title" tabIndex={-1} className="max-w-3xl text-4xl font-semibold tracking-tight text-balance outline-none sm:text-6xl">
          Accessible React components you own, that keep getting better.
        </h1>
        <p className="max-w-2xl text-lg text-balance text-[var(--site-muted)]">
          rdloom is a spec-driven component library. Copy the code into your project, change anything, and still take upgrades.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/docs/getting-started" className="rounded-[var(--site-radius)] bg-[var(--site-primary)] px-4 py-2 font-medium text-[var(--site-on-primary)] hover:bg-[var(--site-primary-hover)]">
            Get started
          </Link>
          <Link href="/components/data-grid" className="rounded-[var(--site-radius)] border border-[var(--site-border)] px-4 py-2 font-medium hover:bg-[var(--site-subtle)]">
            See the DataGrid
          </Link>
        </div>
        <div className="w-full max-w-xl text-start">
          <CodeBlock code={"npx rdloom init\nnpx rdloom add date-range-picker data-grid --install"} label="Quick start" />
        </div>
      </section>

      <section aria-labelledby="live" className="flex flex-col gap-4">
        <h2 id="live" className="text-xl font-semibold">
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

      <section aria-labelledby="why" className="flex flex-col gap-4">
        <h2 id="why" className="text-xl font-semibold">
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

      <section aria-labelledby="all" className="flex flex-col gap-4">
        <h2 id="all" className="text-xl font-semibold">
          {components.length} components
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {components.map((c) => (
            <li key={c.id}>
              <Link
                href={`/components/${c.id}`}
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
