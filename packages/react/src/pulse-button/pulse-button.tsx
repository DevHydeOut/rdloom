"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "../button/button";
import { pulseButtonDefaults, type PulseButtonSpecProps } from "../generated/pulse-button.types";
import { cx } from "../utils/cx";
import { MotionStyle, motionVars } from "../utils/motion";

export interface PulseButtonProps extends PulseButtonSpecProps, Omit<ButtonProps, keyof PulseButtonSpecProps> {}

const css = `
@keyframes rdm-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--rdm-c,var(--rd-color-action-primary)) 55%,transparent)}
  70%,100%{box-shadow:0 0 0 var(--rdm-r,12px) transparent}}
.rdm-pulse{animation:rdm-pulse var(--rdm-d,2s) ease-out infinite}
.rdm-pulse[data-rdm-paused],.rdm-pulse[data-disabled]{animation-play-state:paused}
`;

/** A button with a soft ring that keeps radiating out, to draw the eye to the one action that matters. Builds on Button. */
export const PulseButton = forwardRef<HTMLButtonElement, PulseButtonProps>(function PulseButton(
  { children, duration = pulseButtonDefaults.duration, color, isPaused = pulseButtonDefaults.isPaused, className, style, ...rest },
  ref,
) {
  return (
    <>
      <MotionStyle css={css} still={{ ".rdm-pulse": "animation:none" }} />
      <Button
        {...rest}
        ref={ref}
        data-rdm-paused={isPaused || undefined}
        className={cx("rdm-pulse", className)}
        style={(values) => ({ ...motionVars({ "--rdm-d": `${duration}s`, "--rdm-c": color }), ...(typeof style === "function" ? style(values) : style) })}
      >
        {children}
      </Button>
    </>
  );
});
