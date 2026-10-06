import { useState } from "react";
import { componentGroups, components, displayName, hrefOf, parts } from "../data";
import { Link } from "../router";
import { H2, Muted, PageHeader } from "../ui";

/** Every component on one page: filter by name or purpose, grouped by what they're for. */
export function ComponentsIndex() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = components.filter((c) => !q || `${c.spec.name} ${c.spec.description} ${c.spec.category}`.toLowerCase().includes(q));

  return (
    <div>
      <PageHeader
        title="Components"
        lead={`${parts.length} accessible components and ${components.length - parts.length} ready-made blocks, each with live examples, the props, keyboard and screen reader behaviour, and source you own.`}
      />
      <div className="pb-2">
        <label htmlFor="filter" className="sr-only">
          Filter components
        </label>
        <input
          id="filter"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name or purpose, e.g. date, table, upload"
          className="h-10 w-full rounded-lg border border-[var(--site-border)] bg-[var(--site-bg)] px-3 text-sm outline-none placeholder:text-[var(--site-muted)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
        />
        <p aria-live="polite" className="pt-2 text-xs text-[var(--site-muted)]">
          {q ? `${shown.length} of ${components.length} components` : ""}
        </p>
      </div>

      {shown.length === 0 && <Muted className="py-10 text-center">Nothing matches “{query}”.</Muted>}

      {componentGroups.map((group) => {
        const list = group.items.filter((c) => shown.includes(c));
        if (list.length === 0) return null;
        return (
          <section key={group.id}>
            <H2 id={group.id}>{group.label}</H2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {list.map((c) => (
                <li key={c.id}>
                  <Link
                    href={hrefOf(c)}
                    className="group flex h-full flex-col gap-1.5 rounded-xl border border-[var(--site-border)] p-4 outline-none transition-colors hover:bg-[var(--site-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
                  >
                    <span className="flex items-center justify-between gap-2 font-medium">
                      {displayName(c.spec.name)}
                      <span aria-hidden="true" className="text-[var(--site-muted)] transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </span>
                    <span className="line-clamp-2 text-[13px] leading-5 text-[var(--site-muted)]">{c.spec.description}</span>
                    <span className="pt-1 text-xs text-[var(--site-muted)]">
                      {c.examples.length} {c.examples.length === 1 ? "example" : "examples"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
