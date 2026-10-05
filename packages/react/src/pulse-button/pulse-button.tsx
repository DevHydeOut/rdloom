"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "../button/button";
import { pulseButtonDefaults, type PulseButtonSpecProps } from "../generated/pulse-button.types";
import { cx } from "../utils/cx";
import { motionVars } from "../utils/motion";

export interface PulseButtonProps extends PulseButtonSpecProps, Omit<ButtonProps, keyof PulseButtonSpecProps> {}

/** A button with a soft ring that keeps radiating out, to draw the eye to the one action that matters. Builds on Button. */
export const PulseButton = forwardRef<HTMLButtonElement, PulseButtonProps>(function PulseButton(
  { children, duration = pulseButtonDefaults.duration, color, isPaused = pulseButtonDefaults.isPaused, className, style, ...rest },
  ref,
) {
  return (
    <Button
      {...rest}
      ref={ref}
      data-rdm-paused={isPaused || undefined}
      className={cx("rdm-pulse", className)}
      style={(values) => ({ ...motionVars({ "--rdm-d": `${duration}s`, "--rdm-c": color }), ...(typeof style === "function" ? style(values) : style) })}
    >
      {children}
    </Button>
  );
});
