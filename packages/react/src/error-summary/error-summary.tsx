"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, type HTMLAttributes } from "react";
import { errorSummaryDefaults, type ErrorSummarySpecProps } from "../generated/error-summary.types";
import { useFormContext } from "../form/form";
import { useEngineErrors } from "../form/form-engine";
import { cx } from "../utils/cx";
import { ErrorIcon } from "../utils/icons";

export interface ErrorSummaryProps
  extends ErrorSummarySpecProps,
    Omit<HTMLAttributes<HTMLElement>, keyof ErrorSummarySpecProps | "className" | "title" | "children"> {
  className?: string;
}

/**
 * The list of problems at the top of a Form after a failed submit. Focus moves
 * to it, and each item takes the person to its field. It shows nothing before
 * a submit has failed and goes away once everything is fixed.
 */
export const ErrorSummary = forwardRef<HTMLElement, ErrorSummaryProps>(function ErrorSummary(
  { title = errorSummaryDefaults.title, className, ...rest },
  ref,
) {
  const { engine, state, focusRequest, labels, summaries, focusField, serverErrors } = useFormContext();
  const engineEntries = useEngineErrors(engine);
  const serverEntries = Object.entries(serverErrors).map(([name, message]) => ({ name, message }));
  const entries = [...serverEntries, ...engineEntries.filter((e) => !(e.name in serverErrors))];
  const own = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => own.current as HTMLElement);
  const headingId = useId();
  const linkPrefix = useId();

  // While one is mounted, the form leaves announcing failures to it.
  useEffect(() => {
    summaries.current += 1;
    return () => {
      summaries.current -= 1;
    };
  }, [summaries]);

  const visible = focusRequest > 0 && (entries.length > 0 || Boolean(state.formError));

  useEffect(() => {
    if (focusRequest > 0) own.current?.focus();
  }, [focusRequest]);

  if (!visible) return null;

  return (
    <section
      {...rest}
      ref={own}
      tabIndex={-1}
      aria-labelledby={headingId}
      className={cx(
        "rounded-[var(--rd-radius-overlay)] border p-3.5 text-sm text-[var(--rd-color-text-default)] outline-none " +
          "bg-[var(--rd-color-feedback-danger-subtle)] border-[color-mix(in_srgb,var(--rd-color-feedback-danger)_32%,transparent)] " +
          "[box-shadow:var(--rd-elevation-raised)] focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <ErrorIcon className="mt-0.5 size-5 shrink-0 text-[var(--rd-color-feedback-danger)]" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 id={headingId} className="font-medium">
            {title}
          </h2>
          {state.formError && <p>{state.formError}</p>}
          {entries.length > 0 && (
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {entries.map(({ name, message }) => {
                const label = labels.get(name);
                return (
                  <li key={name}>
                    <a
                      href={`#${linkPrefix}-${name.replace(/[^\w-]/g, "-")}`}
                      className="underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-color-focus-ring)] rounded-sm"
                      onClick={(event) => {
                        event.preventDefault();
                        focusField(name);
                      }}
                    >
                      {label && !message.toLowerCase().startsWith(label.toLowerCase()) ? `${label}: ${message}` : message}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
});
