"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "../button/button";
import { interactiveHoverButtonDefaults, type InteractiveHoverButtonSpecProps } from "../generated/interactive-hover-button.types";
import { cx } from "../utils/cx";
import { ArrowRightIcon } from "../utils/icons";

export interface InteractiveHoverButtonProps
  extends InteractiveHoverButtonSpecProps,
    Omit<ButtonProps, keyof InteractiveHoverButtonSpecProps> {}

/**
 * A button whose label slides away to an arrow (and an optional second label) on hover and keyboard focus.
 * Builds on Button. The second layer is decoration: the accessible name is always the main label.
 */
export const InteractiveHoverButton = forwardRef<HTMLButtonElement, InteractiveHoverButtonProps>(function InteractiveHoverButton(
  {
    children,
    hoverLabel,
    variant = interactiveHoverButtonDefaults.variant,
    size = interactiveHoverButtonDefaults.size,
    className,
    ...rest
  },
  ref,
) {
  return (
    <Button {...rest} ref={ref} variant={variant} size={size} className={cx("rdm-ihb relative overflow-hidden", className)}>
      <span className="rdm-ihb-label">{children}</span>
      <span aria-hidden="true" className="rdm-ihb-hover">
        {hoverLabel}
        <ArrowRightIcon className="size-4 shrink-0 rtl:-scale-x-100" />
      </span>
    </Button>
  );
});
