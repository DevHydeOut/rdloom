"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "../button/button";
import { shinyButtonDefaults, type ShinyButtonSpecProps } from "../generated/shiny-button.types";
import { cx } from "../utils/cx";
import { motionVars } from "../utils/motion";

export interface ShinyButtonProps extends ShinyButtonSpecProps, Omit<ButtonProps, keyof ShinyButtonSpecProps> {}

/** A button with a band of light that sweeps across it on hover and focus, and slowly at rest. Builds on Button. */
export const ShinyButton = forwardRef<HTMLButtonElement, ShinyButtonProps>(function ShinyButton(
  { children, duration = shinyButtonDefaults.duration, isPaused = shinyButtonDefaults.isPaused, className, style, ...rest },
  ref,
) {
  return (
    <Button
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-shiny relative overflow-hidden", className)}
      style={(values) => ({ ...motionVars({ "--rdm-d": `${duration}s` }), ...(typeof style === "function" ? style(values) : style) })}
    >
      <span className="relative z-[1] inline-flex items-center gap-2">{children}</span>
      <span aria-hidden="true" className="rdm-shiny-sweep" />
    </Button>
  );
});
