"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { type CodeComparisonSpecProps } from "../generated/code-comparison.types";
import { cx } from "../utils/cx";

export interface CodeComparisonProps
  extends CodeComparisonSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof CodeComparisonSpecProps | "className" | "children"> {
  className?: string;
}

interface PanelProps {
  title: string;
  code: string;
  language?: string;
  highlight?: number[];
}

function Panel({ title, code, language, highlight = [] }: PanelProps) {
  const lines = code.replace(/\n$/, "").split("\n");
  const marked = lines.map((_, i) => i + 1).filter((n) => highlight.includes(n));
  return (
    <figure
      data-language={language || undefined}
      className="m-0 min-w-0 overflow-hidden rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-subtle)]"
    >
      <figcaption className="border-b border-[var(--rd-color-border-default)] px-3 py-1.5 text-xs text-[var(--rd-color-text-muted)]">
        <span className="font-medium text-[var(--rd-color-text-default)]">{title}</span>
        {language ? <span>{` (${language})`}</span> : null}
        {marked.length ? <span className="sr-only">{`. Highlighted lines: ${marked.join(", ")}`}</span> : null}
      </figcaption>
      {/* A wide line scrolls inside the panel, so the code must be reachable without a mouse. */}
      <pre
        tabIndex={0}
        className="m-0 overflow-x-auto py-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--rd-color-focus-ring)]"
      >
        <code className="block w-max min-w-full font-mono">
          {lines.map((line, i) => {
            const on = highlight.includes(i + 1);
            return (
              <span
                key={i}
                data-highlighted={on || undefined}
                className={cx(
                  "block border-s-2 border-transparent pe-3 ps-3",
                  on && "border-[var(--rd-color-action-primary)] bg-[color-mix(in_srgb,var(--rd-color-action-primary)_14%,transparent)]",
                )}
              >
                <span aria-hidden="true" className="inline-block w-7 select-none pe-3 text-end text-[var(--rd-color-text-muted)]">
                  {i + 1}
                </span>
                {line || " "}
              </span>
            );
          })}
        </code>
      </pre>
    </figure>
  );
}

/** Before and after code in two panels: side by side from the medium breakpoint, stacked on phones. */
export const CodeComparison = forwardRef<HTMLDivElement, CodeComparisonProps>(function CodeComparison(
  { before, after, beforeLabel = "Before", afterLabel = "After", beforeHighlight, afterHighlight, label = "Code comparison", language, className, ...rest },
  ref,
) {
  return (
    <div {...rest} ref={ref} role="group" aria-label={label} className={cx("grid w-full grid-cols-1 gap-4 md:grid-cols-2", className)}>
      <Panel title={beforeLabel} code={before} language={language} highlight={beforeHighlight} />
      <Panel title={afterLabel} code={after} language={language} highlight={afterHighlight} />
    </div>
  );
});
