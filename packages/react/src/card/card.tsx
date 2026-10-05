"use client";

import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import { cardDefaults, type CardSpecProps } from "../generated/card.types";
import { cx } from "../utils/cx";

export interface CardProps
  extends CardSpecProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof CardSpecProps | "className" | "title"> {
  className?: string;
}

const variants: Record<NonNullable<CardSpecProps["variant"]>, string> = {
  outlined: "bg-[var(--rd-color-surface-default)] border border-[var(--rd-color-border-default)]",
  raised: "bg-[var(--rd-color-surface-raised)] border border-[var(--rd-color-border-default)] shadow-md",
  subtle: "bg-[var(--rd-color-surface-subtle)] border border-transparent",
};

const paddings: Record<NonNullable<CardSpecProps["padding"]>, string> = { sm: "p-3 gap-2", md: "p-4 gap-3", lg: "p-6 gap-4" };

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    children,
    title,
    description,
    footer,
    headingLevel = cardDefaults.headingLevel,
    variant = cardDefaults.variant,
    padding = cardDefaults.padding,
    className,
    ...rest
  },
  ref,
) {
  const titleId = useId();
  const level = Math.min(6, Math.max(2, Math.round(headingLevel)));
  const Heading = `h${level}` as "h2";
  return (
    <div
      {...rest}
      ref={ref}
      role={title ? "group" : undefined}
      aria-labelledby={title ? titleId : undefined}
      className={cx(
        "flex flex-col rounded-[var(--rd-radius-overlay)] text-sm text-[var(--rd-color-text-default)]",
        variants[variant],
        paddings[padding],
        className,
      )}
    >
      {(title || description) && (
        <div className="flex flex-col gap-0.5">
          {title && (
            <Heading id={titleId} className="text-base font-semibold">
              {title}
            </Heading>
          )}
          {description && <p className="text-[var(--rd-color-text-muted)]">{description}</p>}
        </div>
      )}
      <div>{children}</div>
      {footer && <CardFooter>{footer}</CardFooter>}
    </div>
  );
});

function CardFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-[var(--rd-color-border-default)] pt-3">{children}</div>
  );
}
