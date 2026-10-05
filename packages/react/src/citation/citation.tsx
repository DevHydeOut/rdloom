"use client";

import type { MouseEvent } from "react";
import type { CitationSpecProps } from "../generated/citation.types";
import { cx } from "../utils/cx";

export interface CitationProps extends CitationSpecProps {
  className?: string;
}

/** The id of the Sources entry for a citation: what the marker jumps to. */
export const sourceElementId = (id: string) => `source-${id}`;

/** A small numbered marker, like [1], that jumps to its source in the Sources list. */
export function Citation({ index, source, href, className }: CitationProps) {
  const target = href ?? `#${sourceElementId(source.id)}`;
  const jump = (event: MouseEvent<HTMLAnchorElement>) => {
    if (href || !target.startsWith("#")) return;
    // A hash link scrolls but doesn't always move keyboard focus: do it, so Tab continues from the source.
    const el = document.getElementById(target.slice(1));
    if (!el) return;
    event.preventDefault();
    el.focus(); // focusing scrolls it into view
  };
  return (
    <sup className={cx("mx-0.5 align-baseline", className)}>
      <a
        href={target}
        onClick={jump}
        aria-label={`Source ${index}: ${source.title}`}
        className={cx(
          "inline-flex min-w-5 items-center justify-center rounded-full border border-[var(--rd-color-border-strong)] bg-[var(--rd-color-surface-subtle)] px-1 text-[0.7rem] font-medium leading-5 no-underline tabular-nums",
          "text-[var(--rd-color-text-default)] outline-none hover:bg-[var(--rd-color-surface-selected)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]",
        )}
      >
        {index}
      </a>
    </sup>
  );
}
