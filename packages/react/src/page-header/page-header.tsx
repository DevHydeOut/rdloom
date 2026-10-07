import { forwardRef, type HTMLAttributes } from "react";
import { pageHeaderDefaults, type PageHeaderSpecProps } from "../generated/page-header.types";
import { cx } from "../utils/cx";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface PageHeaderProps
  extends PageHeaderSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof PageHeaderSpecProps | "className" | "title" | "children"> {
  className?: string;
}

const looks = {
  default: { gap: "gap-3", title: "text-2xl leading-8 tracking-[-0.02em]", bar: "h-8 w-64", pad: "pb-5" },
  compact: { gap: "gap-2", title: "text-lg leading-7 tracking-[-0.01em]", bar: "h-6 w-48", pad: "pb-3" },
} as const;

const pulse = "block max-w-full animate-pulse rounded-[var(--rd-radius-control)] bg-[var(--rd-color-surface-subtle)] motion-reduce:animate-none";

/**
 * The top of a page: breadcrumbs, a title with badges, a description, actions on the right and
 * tabs underneath. The title is an h1 unless you change `headingLevel`.
 */
export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(function PageHeader(
  {
    title,
    headingLevel = pageHeaderDefaults.headingLevel,
    description,
    breadcrumbs,
    meta,
    actions,
    tabs,
    isLoading = pageHeaderDefaults.isLoading,
    size = pageHeaderDefaults.size,
    border = pageHeaderDefaults.border,
    classNames,
    className,
    ...rest
  },
  ref,
) {
  const level = Math.min(6, Math.max(1, Math.round(headingLevel)));
  const Heading = `h${level}` as "h1";
  const look = looks[size];
  return (
    <div
      {...rest}
      ref={ref}
      aria-busy={isLoading || undefined}
      className={cx("flex min-w-0 flex-col", look.gap, border && cx("border-b border-[var(--rd-color-border-default)]", tabs ? "" : look.pad), classNames?.root, className)}
    >
      {breadcrumbs && <div className={cx("min-w-0", classNames?.breadcrumbs)}>{breadcrumbs}</div>}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-1 basis-80 flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <Heading className={cx("min-w-0 font-semibold text-balance text-[var(--rd-color-text-default)]", look.title, classNames?.title)}>
              {isLoading ? (
                <>
                  <span className="sr-only">Loading</span>
                  <span aria-hidden="true" className={cx(pulse, look.bar)} />
                </>
              ) : (
                title
              )}
            </Heading>
            {meta && !isLoading && <div className={cx("flex flex-wrap items-center gap-2", classNames?.meta)}>{meta}</div>}
          </div>
          {isLoading ? (
            description ? <span aria-hidden="true" className={cx(pulse, "h-4 w-96")} /> : null
          ) : (
            description && <div className={cx("max-w-prose text-sm text-[var(--rd-color-text-muted)]", classNames?.description)}>{description}</div>
          )}
        </div>
        {actions && <div className={cx("flex flex-wrap items-center gap-2", classNames?.actions)}>{actions}</div>}
      </div>
      {tabs && <div className={cx("min-w-0", classNames?.tabs)}>{tabs}</div>}
    </div>
  );
});
