import { forwardRef, type HTMLAttributes } from "react";
import { sectionHeaderDefaults, type SectionHeaderSpecProps } from "../generated/section-header.types";
import { cx } from "../utils/cx";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface SectionHeaderProps
  extends SectionHeaderSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof SectionHeaderSpecProps | "className" | "title" | "children"> {
  className?: string;
}

const looks = {
  default: { title: "text-lg leading-7", pad: "pb-4" },
  compact: { title: "text-base leading-6", pad: "pb-3" },
} as const;

/** The heading of a section inside a page: a title, a description and actions on the right. The title is an h2 unless you change `headingLevel`. */
export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(function SectionHeader(
  {
    title,
    headingLevel = sectionHeaderDefaults.headingLevel,
    description,
    actions,
    size = sectionHeaderDefaults.size,
    divider = sectionHeaderDefaults.divider,
    classNames,
    className,
    ...rest
  },
  ref,
) {
  const level = Math.min(6, Math.max(2, Math.round(headingLevel)));
  const Heading = `h${level}` as "h2";
  const look = looks[size];
  return (
    <div
      {...rest}
      ref={ref}
      className={cx(
        "flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-2",
        divider && cx("border-b border-[var(--rd-color-border-default)]", look.pad),
        classNames?.root,
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 basis-60 flex-col gap-0.5">
        <Heading className={cx("font-semibold tracking-tight text-[var(--rd-color-text-default)]", look.title, classNames?.title)}>{title}</Heading>
        {description && <div className={cx("max-w-prose text-sm text-[var(--rd-color-text-muted)]", classNames?.description)}>{description}</div>}
      </div>
      {actions && <div className={cx("flex flex-wrap items-center gap-2", classNames?.actions)}>{actions}</div>}
    </div>
  );
});
