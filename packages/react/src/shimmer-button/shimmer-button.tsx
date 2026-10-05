"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "../button/button";
import { shimmerButtonDefaults, type ShimmerButtonSpecProps } from "../generated/shimmer-button.types";
import { cx } from "../utils/cx";
import { motionVars } from "../utils/motion";

export interface ShimmerButtonProps extends ShimmerButtonSpecProps, Omit<ButtonProps, keyof ShimmerButtonSpecProps> {}

/** A button whose surface is crossed by a soft band of light, now and then. Builds on Button. */
export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(function ShimmerButton(
  { children, duration = shimmerButtonDefaults.duration, isPaused = shimmerButtonDefaults.isPaused, className, style, ...rest },
  ref,
) {
  return (
    <Button
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      className={cx("relative overflow-hidden", className)}
      style={(values) => ({ ...motionVars({ "--rdm-d": `${duration}s` }), ...(typeof style === "function" ? style(values) : style) })}
    >
      <span className="relative z-[1] inline-flex items-center gap-2">{children}</span>
      <span aria-hidden="true" className="rdm-shimmer" />
    </Button>
  );
});
