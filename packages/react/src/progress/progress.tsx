"use client";

import { forwardRef } from "react";
import { Label, ProgressBar as AriaProgressBar, type ProgressBarProps as AriaProgressBarProps } from "react-aria-components";
import { progressDefaults, type ProgressSpecProps } from "../generated/progress.types";
import { cx } from "../utils/cx";

export interface ProgressProps
  extends ProgressSpecProps,
    Omit<AriaProgressBarProps, keyof ProgressSpecProps | "className" | "children" | "aria-label" | "valueLabel"> {
  className?: string;
}

const bars: Record<NonNullable<ProgressSpecProps["variant"]>, string> = {
  default: "bg-[var(--rd-color-action-primary)]",
  success: "bg-[var(--rd-color-feedback-success)]",
  warning: "bg-[var(--rd-color-feedback-warning)]",
  danger: "bg-[var(--rd-color-feedback-danger)]",
};
const heights: Record<NonNullable<ProgressSpecProps["size"]>, string> = { sm: "h-1.5", md: "h-2.5" };

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  {
    label,
    valueLabel,
    variant = progressDefaults.variant,
    size = progressDefaults.size,
    showValue = progressDefaults.showValue,
    isIndeterminate = progressDefaults.isIndeterminate,
    minValue = progressDefaults.minValue,
    maxValue = progressDefaults.maxValue,
    className,
    ...rest
  },
  ref,
) {
  return (
    <AriaProgressBar
      {...rest}
      ref={ref}
      minValue={minValue}
      maxValue={maxValue}
      isIndeterminate={isIndeterminate}
      valueLabel={valueLabel}
      className={cx("flex w-full flex-col gap-1.5 text-sm", className)}
    >
      {({ percentage, valueText }) => (
        <>
          <div className="flex items-baseline justify-between gap-2">
            <Label className="font-medium text-[var(--rd-color-text-default)]">{label}</Label>
            {showValue && !isIndeterminate && (
              <span className="tabular-nums text-[var(--rd-color-text-muted)]">{valueLabel ?? valueText}</span>
            )}
          </div>
          <div className={cx("w-full overflow-hidden rounded-full bg-[var(--rd-color-border-default)]", heights[size])}>
            <div
              className={cx(
                "h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none",
                bars[variant],
                // The amount is unknown: a full, pulsing bar. Reduced motion keeps it still.
                isIndeterminate && "w-full animate-pulse motion-reduce:animate-none",
              )}
              style={isIndeterminate ? undefined : { width: `${percentage}%` }}
            />
          </div>
        </>
      )}
    </AriaProgressBar>
  );
});
