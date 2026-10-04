"use client";

import { forwardRef } from "react";
import {
  Tooltip as AriaTooltip,
  TooltipTrigger,
  type TooltipProps as AriaTooltipProps,
} from "react-aria-components";
import { tooltipDefaults, type TooltipSpecProps } from "../generated/tooltip.types";
import { Arrow } from "../utils/arrow";
import { cx } from "../utils/cx";

export { TooltipTrigger };

export interface TooltipProps
  extends TooltipSpecProps,
    Omit<AriaTooltipProps, keyof TooltipSpecProps | "className" | "children"> {
  className?: string;
}

// Inverted colors: the tooltip uses the text color as its background.
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  { children, placement = tooltipDefaults.placement, showArrow = tooltipDefaults.showArrow, className, ...rest },
  ref,
) {
  return (
    <AriaTooltip
      {...rest}
      ref={ref}
      placement={placement}
      offset={showArrow ? 10 : 6}
      className={cx(
        "max-w-64 px-2.5 py-1.5 text-xs font-medium shadow-md " +
          "bg-[var(--rd-color-text-default)] text-[var(--rd-color-surface-default)] rounded-[var(--rd-radius-control)]",
        className,
      )}
    >
      {showArrow && <Arrow className="fill-[var(--rd-color-text-default)]" />}
      {children}
    </AriaTooltip>
  );
});
