"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "../button/button";
import type { RevealButtonSpecProps } from "../generated/reveal-button.types";
import { cx } from "../utils/cx";

export interface RevealButtonProps extends RevealButtonSpecProps, Omit<ButtonProps, keyof RevealButtonSpecProps> {}

/**
 * A button that opens an arrow beside its label when you hover or focus it. Only a transition,
 * so there is nothing to pause, and it is switched off for reduced motion. Builds on Button.
 */
export const RevealButton = forwardRef<HTMLButtonElement, RevealButtonProps>(function RevealButton(
  { children, className, ...rest },
  ref,
) {
  return (
    <Button {...rest} ref={ref} className={cx("group", className)}>
      <span className="inline-flex items-center">
        <span className="transition-transform duration-300 ease-out group-data-[hovered]:-translate-x-0.5 group-data-[focus-visible]:-translate-x-0.5 motion-reduce:transition-none">
          {children}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="ms-0 size-4 w-0 -translate-x-2 opacity-0 transition-all duration-300 ease-out group-data-[hovered]:ms-2 group-data-[hovered]:w-4 group-data-[hovered]:translate-x-0 group-data-[hovered]:opacity-100 group-data-[focus-visible]:ms-2 group-data-[focus-visible]:w-4 group-data-[focus-visible]:translate-x-0 group-data-[focus-visible]:opacity-100 motion-reduce:transition-none"
          fill="none"
        >
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Button>
  );
});
