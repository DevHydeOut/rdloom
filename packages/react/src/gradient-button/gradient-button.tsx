"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "../button/button";
import { gradientButtonDefaults, type GradientButtonSpecProps } from "../generated/gradient-button.types";
import { cx } from "../utils/cx";

export interface GradientButtonProps extends GradientButtonSpecProps, Omit<ButtonProps, keyof GradientButtonSpecProps> {}

const defaultColors = ["var(--rd-color-action-primary)", "var(--rd-color-feedback-warning)", "var(--rd-color-feedback-info)"];

/**
 * A button with a colour that travels around its edge. The label sits on the normal button
 * surface, so its contrast is the plain Button's, whatever the colours do. Builds on Button.
 */
export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(function GradientButton(
  {
    children,
    colors = defaultColors,
    duration = gradientButtonDefaults.duration,
    borderWidth = gradientButtonDefaults.borderWidth,
    isPaused = gradientButtonDefaults.isPaused,
    variant = "secondary",
    isDisabled,
    className,
    ...rest
  },
  ref,
) {
  const ring = [...colors, colors[0]].join(", ");
  return (
    <span
      data-rdm-paused={isPaused || isDisabled || undefined}
      className={cx("rdm-gradient inline-flex rounded-[var(--rd-radius-control)]", isDisabled && "opacity-50")}
      style={{
        padding: borderWidth,
        backgroundImage: `conic-gradient(from var(--rdm-angle), ${ring})`,
        ["--rdm-d" as string]: `${duration}s`,
      }}
    >
      <Button
        {...rest}
        ref={ref}
        variant={variant}
        isDisabled={isDisabled}
        className={cx("!border-transparent", className)}
        style={{ borderRadius: `calc(var(--rd-radius-control) - ${borderWidth}px)` }}
      >
        {children}
      </Button>
    </span>
  );
});
