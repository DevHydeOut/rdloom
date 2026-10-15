"use client";

import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { lineShadowTextDefaults, type LineShadowTextSpecProps } from "../generated/line-shadow-text.types";
import { cx } from "../utils/cx";

export interface LineShadowTextProps
  extends LineShadowTextSpecProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof LineShadowTextSpecProps | "className" | "children"> {
  className?: string;
}

/**
 * Text with a diagonal line shadow behind it. The real text is rendered once; the shadow is an
 * aria-hidden, non-selectable copy that is clipped to a line pattern.
 */
export const LineShadowText = forwardRef<HTMLSpanElement, LineShadowTextProps>(function LineShadowText(
  { children, shadowColor = lineShadowTextDefaults.shadowColor, isPaused = lineShadowTextDefaults.isPaused, className, style, ...rest },
  ref,
) {
  return (
    <span
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-line-shadow", className)}
      style={{ "--rdm-c": shadowColor, ...style } as CSSProperties}
    >
      {children}
      <span aria-hidden="true" className="rdm-line-shadow-layer">
        {children}
      </span>
    </span>
  );
});
