import { forwardRef, type HTMLAttributes } from "react";
import { errorStateDefaults, type ErrorStateSpecProps } from "../generated/error-state.types";
import { cx } from "../utils/cx";
import { WarningIcon } from "../utils/icons";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface ErrorStateProps
  extends ErrorStateSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof ErrorStateSpecProps | "className" | "title" | "children" | "role"> {
  className?: string;
}

const variants = {
  inline: "gap-3 rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] px-6 py-10",
  page: "min-h-[24rem] flex-1 gap-4 px-6 py-16",
} as const;

/** A failed load, or a 404, 403 or 500 screen: what happened and how to go on. Use `announce` only when it appears after the page loaded. */
export const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(function ErrorState(
  { title, description, icon, code, actions, variant = errorStateDefaults.variant, headingLevel = errorStateDefaults.headingLevel, announce = errorStateDefaults.announce, classNames, className, ...rest },
  ref,
) {
  const level = Math.min(6, Math.max(1, Math.round(headingLevel)));
  const Heading = `h${level}` as "h2";
  const page = variant === "page";
  const picture = icon ?? (code ? null : <WarningIcon className="size-full" />);
  return (
    <div {...rest} ref={ref} role={announce ? "alert" : undefined} className={cx("flex w-full flex-col items-center justify-center text-center", variants[variant], classNames?.root, className)}>
      {picture && (
        <div
          aria-hidden="true"
          className={cx(
            "flex items-center justify-center rounded-full bg-[var(--rd-color-surface-subtle)] text-[var(--rd-color-feedback-danger)] ring-1 ring-[var(--rd-color-border-default)] [&>svg]:size-1/2",
            page ? "size-14" : "size-12",
            classNames?.icon,
          )}
        >
          {picture}
        </div>
      )}
      {code && <p className={cx("font-semibold tracking-tight text-[var(--rd-color-text-muted)]", page ? "text-6xl" : "text-4xl", classNames?.code)}>{code}</p>}
      <div className="flex max-w-md flex-col gap-1.5">
        <Heading className={cx("font-semibold tracking-tight text-balance text-[var(--rd-color-text-default)]", page ? "text-2xl" : "text-base", classNames?.title)}>{title}</Heading>
        {description && <p className={cx("text-sm text-balance text-[var(--rd-color-text-muted)]", classNames?.description)}>{description}</p>}
      </div>
      {actions && <div className={cx("mt-1 flex flex-wrap items-center justify-center gap-2", classNames?.actions)}>{actions}</div>}
    </div>
  );
});
