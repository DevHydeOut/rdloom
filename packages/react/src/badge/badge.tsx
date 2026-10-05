import { forwardRef, type HTMLAttributes } from "react";
import { badgeDefaults, type BadgeSpecProps } from "../generated/badge.types";
import { cx } from "../utils/cx";

// Plain markup with no hooks, so it also works in a React Server Component.

export interface BadgeProps
  extends BadgeSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof BadgeSpecProps | "className"> {
  className?: string;
}

const tones: Record<NonNullable<BadgeSpecProps["variant"]>, { box: string; dot: string }> = {
  neutral: {
    box: "bg-[var(--rd-color-surface-subtle)] border-[var(--rd-color-border-default)]",
    dot: "bg-[var(--rd-color-text-muted)]",
  },
  info: {
    box: "bg-[var(--rd-color-feedback-info-subtle)] border-transparent",
    dot: "bg-[var(--rd-color-feedback-info)]",
  },
  success: {
    box: "bg-[var(--rd-color-feedback-success-subtle)] border-transparent",
    dot: "bg-[var(--rd-color-feedback-success)]",
  },
  warning: {
    box: "bg-[var(--rd-color-feedback-warning-subtle)] border-transparent",
    dot: "bg-[var(--rd-color-feedback-warning)]",
  },
  danger: {
    box: "bg-[var(--rd-color-feedback-danger-subtle)] border-transparent",
    dot: "bg-[var(--rd-color-feedback-danger)]",
  },
};

const sizes: Record<NonNullable<BadgeSpecProps["size"]>, string> = {
  sm: "gap-1 px-1.5 py-px text-xs",
  md: "gap-1.5 px-2 py-0.5 text-sm",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { children, variant = badgeDefaults.variant, size = badgeDefaults.size, className, ...rest },
  ref,
) {
  const tone = tones[variant];
  return (
    <span
      {...rest}
      ref={ref}
      className={cx(
        "inline-flex items-center rounded-full border font-medium whitespace-nowrap text-[var(--rd-color-text-default)]",
        tone.box,
        sizes[size],
        className,
      )}
    >
      {/* The word says the status; the dot is only decoration. */}
      <span aria-hidden="true" className={cx("size-1.5 shrink-0 rounded-full", tone.dot)} />
      {children}
    </span>
  );
});
