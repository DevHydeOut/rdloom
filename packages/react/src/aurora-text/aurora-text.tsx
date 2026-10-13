"use client";

import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { auroraTextDefaults, type AuroraTextSpecProps } from "../generated/aurora-text.types";
import { cx } from "../utils/cx";

export interface AuroraTextProps
  extends AuroraTextSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof AuroraTextSpecProps | "className" | "children"> {
  className?: string;
}

const defaultColors = ["var(--rd-color-action-primary)", "var(--rd-color-feedback-info)", "var(--rd-color-feedback-success)"];

/**
 * Text filled with a slow, drifting gradient. It is ordinary text: where the gradient cannot be used
 * (reduced motion, high contrast, no background-clip support) it is drawn in the default text colour.
 */
export const AuroraText = forwardRef<HTMLSpanElement, AuroraTextProps>(function AuroraText(
  { children, colors, speed = auroraTextDefaults.speed, isPaused = auroraTextDefaults.isPaused, className, style, ...rest },
  ref,
) {
  const list = colors && colors.length > 0 ? colors : defaultColors;
  const gradient = `linear-gradient(100deg, ${[...list, list[0]].join(", ")})`;
  return (
    <span
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-aurora", className)}
      style={{ "--rdm-grad": gradient, "--rdm-d": `${10 / Math.max(speed, 0.1)}s`, ...style } as CSSProperties}
    >
      {children}
    </span>
  );
});
