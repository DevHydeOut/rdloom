"use client";

import { sourcesDefaults, type SourcesSpecProps } from "../generated/sources.types";
import { cx } from "../utils/cx";

export interface SourcesProps extends SourcesSpecProps {
  className?: string;
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
};
const isWeb = (url: string) => /^https?:/i.test(url);

/** The numbered list of sources a reply drew on. Each entry is what a Citation marker jumps to. */
export function Sources({ sources, label = sourcesDefaults.label, className }: SourcesProps) {
  if (sources.length === 0) return null;
  return (
    <section aria-label={label} className={cx("text-sm", className)}>
      <h4 className="mb-2 text-xs font-semibold tracking-wide text-[var(--rd-color-text-muted)] uppercase">{label}</h4>
      <ol className="flex flex-col gap-1.5">
        {sources.map((source, i) => {
          const host = source.url ? hostOf(source.url) : undefined;
          return (
            <li
              key={source.id}
              id={`source-${source.id}`}
              // Focusable so a Citation marker can move focus here.
              tabIndex={-1}
              className="flex gap-2.5 rounded-[var(--rd-radius-control)] p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] target:bg-[var(--rd-color-surface-selected)]"
            >
              <span aria-hidden="true" className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-[var(--rd-color-border-strong)] text-[0.7rem] tabular-nums">
                {i + 1}
              </span>
              <span className="flex min-w-0 flex-col">
                {source.url && isWeb(source.url) ? (
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-block min-h-6 py-0.5 font-medium underline underline-offset-2 hover:text-[var(--rd-color-action-primary)]">
                    {source.title}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <span className="font-medium">{source.title}</span>
                )}
                {host && <span className="text-xs text-[var(--rd-color-text-muted)]">{host}</span>}
                {source.snippet && <span className="line-clamp-2 text-[var(--rd-color-text-muted)]">{source.snippet}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
