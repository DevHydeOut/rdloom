"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "../button/button";
import { rainbowButtonDefaults, type RainbowButtonSpecProps } from "../generated/rainbow-button.types";
import { cx } from "../utils/cx";
import { motionVars } from "../utils/motion";

export interface RainbowButtonProps extends RainbowButtonSpecProps, Omit<ButtonProps, keyof RainbowButtonSpecProps> {}

/**
 * A button with a multicolour border and a soft glow that travel round it. The label sits on the
 * normal button surface, so its contrast is the plain Button's. Builds on Button.
 */
export const RainbowButton = forwardRef<HTMLButtonElement, RainbowButtonProps>(function RainbowButton(
  {
    children,
    duration = rainbowButtonDefaults.duration,
    isPaused = rainbowButtonDefaults.isPaused,
    variant = rainbowButtonDefaults.variant,
    isDisabled,
    className,
    ...rest
  },
  ref,
) {
  return (
    <span
      data-rdm-paused={isPaused || isDisabled || undefined}
      className={cx("rdm-rainbow inline-flex rounded-[var(--rd-radius-control)] p-0.5", isDisabled && "opacity-50")}
      style={motionVars({ "--rdm-d": `${duration}s` })}
    >
      <span aria-hidden="true" className="rdm-rainbow-glow" />
      <Button
        {...rest}
        ref={ref}
        variant={variant}
        isDisabled={isDisabled}
        className={cx("!border-transparent", variant === "ghost" && "!bg-[var(--rd-color-surface-default)]", className)}
        style={{ borderRadius: "calc(var(--rd-radius-control) - 2px)" }}
      >
        {children}
      </Button>
    </span>
  );
});
