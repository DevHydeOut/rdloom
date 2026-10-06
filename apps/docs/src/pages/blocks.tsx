import { ToastRegion } from "@rdloom/react";
import { blocks, components, displayName, hrefOf } from "../data";
import { Link } from "../router";
import { PageHeader } from "../ui";
import { ArrowRightIcon } from "../icons";
import { Live } from "./component-page";

/** Every block, each with a small live picture of its first example. */
export function BlocksIndex() {
  return (
    <div>
      <PageHeader
        title="Blocks"
        lead={`${blocks.length} ready-made screens built from rdloom components. Each one opens at full width, with a switch to see it on a tablet and a phone, and a full-screen view. Copy it into your project and change anything.`}
      />
      <ul className="grid gap-5 md:grid-cols-2">
        {blocks.map((c) => {
          const first = c.examples[0];
          return (
            <li key={c.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--site-border)] transition-colors focus-within:ring-2 focus-within:ring-[var(--rd-color-focus-ring)] hover:border-[var(--site-border-strong)]">
              {/* A small picture of the real block: it is shrunk, and nothing in it can be pressed or read twice. */}
              <div aria-hidden="true" className="relative h-56 overflow-hidden border-b border-[var(--site-border)] bg-[var(--site-subtle)]">
                {first && (
                  <div inert className="pointer-events-none absolute start-4 top-4 w-[1100px] origin-top-left scale-[0.34] select-none">
                    <Live component={c} example={first} />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 p-4">
                <span className="flex items-center justify-between gap-2 font-medium">
                  {/* The one link of the card; it stretches over the whole card, so the card is one target (and the picture, which has links of its own, is not inside a link). */}
                  <Link href={hrefOf(c)} className="outline-none after:absolute after:inset-0 after:content-['']">
                    {displayName(c.spec.name)}
                  </Link>
                  <ArrowRightIcon size={15} className="text-[var(--site-muted)] transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="line-clamp-3 text-[13px] leading-5 text-[var(--site-muted)]">{c.spec.description}</span>
                <span className="pt-1 text-xs text-[var(--site-muted)]">
                  {c.examples.length} {c.examples.length === 1 ? "example" : "examples"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** One example at the size of the window, with no site around it: how the block really lays out. */
export function FullScreenPage({ id, name }: { id: string; name: string }) {
  const component = components.find((c) => c.id === id);
  const example = component?.examples.find((e) => e.name === name);
  if (!component || !example) return <p className="p-6">No example {id}/{name}</p>;
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[var(--rd-color-surface-default)] text-[var(--rd-color-text-default)]">
      {/* The examples draw their own frame (a border, a fixed height) for the docs page: here the block fills the window. */}
      <div className="h-full w-full overflow-auto [&>div]:!h-full [&>div]:!w-full [&>div]:!max-w-none [&>div]:!rounded-none [&>div]:!border-0">
        <Live component={component} example={example} />
      </div>
      <a
        href={`/blocks/${id}`}
        className="fixed end-3 bottom-3 z-40 rounded-full border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-raised)] px-3 py-1.5 text-xs font-medium text-[var(--rd-color-text-default)] [box-shadow:var(--rd-elevation-floating)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]"
      >
        Back to the docs
      </a>
      <ToastRegion />
    </div>
  );
}
