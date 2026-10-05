"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "../button/button";
import { gradientButtonDefaults, type GradientButtonSpecProps } from "../generated/gradient-button.types";
import { cx } from "../utils/cx";
import { MotionStyle } from "../utils/motion";

export interface GradientButtonProps extends GradientButtonSpecProps, Omit<ButtonProps, keyof GradientButtonSpecProps> {}

const css = `
@property --rdm-angle{syntax:"<angle>";inherits:false;initial-value:0deg}
@keyframes rdm-spin{to{--rdm-angle:360deg}}
.rdm-gradient{animation:rdm-spin var(--rdm-d,3s) linear infinite}
.rdm-gradient[data-rdm-paused]{animation-play-state:paused}
`;

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
    <>
      <MotionStyle css={css} still={{ ".rdm-gradient": "animation:none" }} />
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
    </>
  );
});
