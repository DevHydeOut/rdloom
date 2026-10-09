"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { Button, Link } from "react-aria-components";
import { bentoGridDefaults, type BentoGridSpecProps } from "../generated/bento-grid.types";
import { cx } from "../utils/cx";

export interface BentoGridProps
  extends BentoGridSpecProps,
    Omit<HTMLAttributes<HTMLUListElement>, keyof BentoGridSpecProps | "className"> {
  className?: string;
}

/**
 * A responsive grid of feature cards. It is a real list: put BentoCard children inside. One column on
 * phones, three from the medium breakpoint, where each card can span columns and rows.
 */
export const BentoGrid = forwardRef<HTMLUListElement, BentoGridProps>(function BentoGrid(
  { children, label, isStill = bentoGridDefaults.isStill, className, ...rest },
  ref,
) {
  return (
    <ul
      {...rest}
      ref={ref}
      aria-label={label ?? rest["aria-label"]}
      data-rdm-still={isStill || undefined}
      className={cx("rdm-bento m-0 grid w-full list-none grid-cols-1 gap-4 p-0 md:auto-rows-[minmax(11rem,auto)] md:grid-cols-3", className)}
    >
      {children}
    </ul>
  );
});

const colSpans = { 1: "", 2: "md:col-span-2", 3: "md:col-span-3" } as const;
const rowSpans = { 1: "", 2: "md:row-span-2" } as const;

export interface BentoCardProps extends Omit<HTMLAttributes<HTMLLIElement>, "title"> {
  /** The card heading. */
  title: ReactNode;
  /** A sentence or two under the heading. */
  description?: ReactNode;
  /** A decorative icon above the heading. Hidden from assistive technology. */
  icon?: ReactNode;
  /** Decoration behind the content, such as a gradient or an illustration. Hidden from assistive technology. */
  background?: ReactNode;
  /** Columns the card takes from the medium breakpoint. */
  colSpan?: 1 | 2 | 3;
  /** Rows the card takes from the medium breakpoint. */
  rowSpan?: 1 | 2;
  /** Heading level of the title, to fit the page outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Makes the card a link. */
  href?: string;
  /** Makes the card a button, when there is no href. */
  onAction?: () => void;
  /** Name of the link or button. Defaults to "Learn more". */
  actionLabel?: string;
  className?: string;
}

/** One card of a BentoGrid. With href or onAction the whole card is operated by a single link or button. */
export const BentoCard = forwardRef<HTMLLIElement, BentoCardProps>(function BentoCard(
  { title, description, icon, background, colSpan = 1, rowSpan = 1, headingLevel = 3, href, onAction, actionLabel = "Learn more", className, ...rest },
  ref,
) {
  const Heading = `h${headingLevel}` as "h3";
  const stretch =
    "mt-auto inline-flex w-fit items-center gap-1 text-sm font-medium text-[var(--rd-color-action-primary)] outline-none after:absolute after:inset-0 after:rounded-[var(--rd-radius-overlay)] data-[focus-visible]:after:ring-2 data-[focus-visible]:after:ring-[var(--rd-color-focus-ring)]";
  return (
    <li
      {...rest}
      ref={ref}
      className={cx(
        "rdm-bento-card relative flex min-h-0 flex-col gap-2 overflow-hidden rounded-[var(--rd-radius-overlay)] border border-[var(--rd-color-border-default)] bg-[var(--rd-color-surface-default)] p-5 text-[var(--rd-color-text-default)]",
        colSpans[colSpan],
        rowSpans[rowSpan],
        className,
      )}
    >
      {background ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {background}
        </div>
      ) : null}
      {icon ? (
        <span aria-hidden="true" className="relative inline-flex size-9 items-center justify-center rounded-[var(--rd-radius-control)] border border-[var(--rd-color-border-default)]">
          {icon}
        </span>
      ) : null}
      <Heading className="relative m-0 text-base font-semibold">{title}</Heading>
      {description ? <p className="relative m-0 text-sm text-[var(--rd-color-text-muted)]">{description}</p> : null}
      {href ? (
        <Link href={href} className={stretch}>
          {actionLabel}
        </Link>
      ) : onAction ? (
        <Button onPress={onAction} className={stretch}>
          {actionLabel}
        </Button>
      ) : null}
    </li>
  );
});
